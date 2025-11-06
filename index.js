#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// CodeMenu API configuration
// Default to local server as per CodeMenu documentation
const CODEMENU_API_BASE = process.env.CODEMENU_API_URL || 'http://127.0.0.1:1300/v1';
const CODEMENU_API_KEY = process.env.CODEMENU_API_KEY || '';

/**
 * Make a request to the CodeMenu API
 * CodeMenu API uses query parameters for authentication and filtering
 */
async function makeCodeMenuRequest(endpoint) {
  const url = `${CODEMENU_API_BASE}${endpoint}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CodeMenu API error (${response.status}): ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    // Preserve original error for better debugging
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`Network error connecting to CodeMenu API at ${url}. Make sure CodeMenu is running and the API is enabled in settings.`);
    }
    throw error;
  }
}

/**
 * Build query string with key parameter if available
 */
function buildQueryString(params = {}) {
  const queryParams = new URLSearchParams();
  
  // Add API key if provided
  if (CODEMENU_API_KEY) {
    queryParams.append('key', CODEMENU_API_KEY);
  }
  
  // Add other parameters
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value);
    }
  }
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

// Create MCP server instance
const server = new Server(
  {
    name: 'codemenu-mcp',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_snippets',
        description: 'List code snippets from CodeMenu without full code content (to reduce token usage). Returns id, title, description, language, abbreviation, tags, and group info.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query - returns snippets whose code, title, or description contain this text',
            },
            language: {
              type: 'string',
              description: 'Filter by programming language (e.g., javascript, python, swift)',
            },
            tag: {
              type: 'string',
              description: 'Filter by tag ID - returns snippets with this tag',
            },
            group: {
              type: 'string',
              description: 'Filter by group ID - returns snippets in this group',
            },
          },
        },
      },
      {
        name: 'get_snippet',
        description: 'Get full details of a specific snippet by ID, including the complete code content',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The unique identifier of the snippet (UUID format)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'list_tags',
        description: 'List all tags available in CodeMenu',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_groups',
        description: 'List all groups available in CodeMenu',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_snippets': {
        const { query, language, tag, group } = args;
        const params = {};
        if (query) params.query = query;
        if (language) params.language = language;
        if (tag) params.tag = tag;
        if (group) params.group = group;
        
        const queryString = buildQueryString(params);
        const snippets = await makeCodeMenuRequest(`/snippets/${queryString}`);
        
        // Remove code content to reduce token usage
        const snippetsWithoutCode = snippets.map(snippet => {
          const { code, ...rest } = snippet;
          return {
            ...rest,
            code_length: code ? code.length : 0,
            has_code: !!code,
          };
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(snippetsWithoutCode, null, 2),
            },
          ],
        };
      }

      case 'get_snippet': {
        const { id } = args;
        if (!id) {
          throw new Error('Snippet ID is required');
        }
        
        // Get all snippets and find the one with matching ID
        const queryString = buildQueryString();
        const snippets = await makeCodeMenuRequest(`/snippets/${queryString}`);
        const snippet = snippets.find(s => s.id === id);
        
        if (!snippet) {
          throw new Error(`Snippet with ID ${id} not found`);
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(snippet, null, 2),
            },
          ],
        };
      }

      case 'list_tags': {
        const queryString = buildQueryString();
        const tags = await makeCodeMenuRequest(`/tags/${queryString}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tags, null, 2),
            },
          ],
        };
      }

      case 'list_groups': {
        const queryString = buildQueryString();
        const groups = await makeCodeMenuRequest(`/groups/${queryString}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(groups, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('CodeMenu MCP server running on stdio');
  console.error(`Connecting to CodeMenu API at: ${CODEMENU_API_BASE}`);
  if (CODEMENU_API_KEY) {
    console.error('Using API key authentication');
  } else {
    console.error('No API key configured (set CODEMENU_API_KEY if required)');
  }
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
