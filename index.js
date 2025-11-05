#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// CodeMenu API configuration
const CODEMENU_API_BASE = process.env.CODEMENU_API_URL || 'https://api.codemenu.io/v1';
const CODEMENU_API_KEY = process.env.CODEMENU_API_KEY || '';

/**
 * Make a request to the CodeMenu API
 */
async function makeCodeMenuRequest(endpoint, method = 'GET', body = null) {
  const url = `${CODEMENU_API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };

  if (CODEMENU_API_KEY) {
    headers['Authorization'] = `Bearer ${CODEMENU_API_KEY}`;
  }

  const options = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
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
      throw new Error(`Network error connecting to CodeMenu API at ${url}: ${error.message}`);
    }
    throw error;
  }
}

// Create MCP server instance
const server = new Server(
  {
    name: 'codemenu-mcp',
    version: '1.0.0',
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
        description: 'List all code snippets from CodeMenu',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of snippets to return (default: 50)',
            },
            offset: {
              type: 'number',
              description: 'Number of snippets to skip for pagination (default: 0)',
            },
            category: {
              type: 'string',
              description: 'Filter snippets by category',
            },
          },
        },
      },
      {
        name: 'get_snippet',
        description: 'Get a specific code snippet by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The unique identifier of the snippet',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'create_snippet',
        description: 'Create a new code snippet in CodeMenu',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'The title of the snippet',
            },
            code: {
              type: 'string',
              description: 'The code content',
            },
            language: {
              type: 'string',
              description: 'Programming language (e.g., javascript, python, java)',
            },
            description: {
              type: 'string',
              description: 'Optional description of the snippet',
            },
            category: {
              type: 'string',
              description: 'Optional category/tag for the snippet',
            },
          },
          required: ['title', 'code', 'language'],
        },
      },
      {
        name: 'update_snippet',
        description: 'Update an existing code snippet',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The unique identifier of the snippet',
            },
            title: {
              type: 'string',
              description: 'The new title of the snippet',
            },
            code: {
              type: 'string',
              description: 'The new code content',
            },
            language: {
              type: 'string',
              description: 'Programming language',
            },
            description: {
              type: 'string',
              description: 'New description of the snippet',
            },
            category: {
              type: 'string',
              description: 'New category/tag for the snippet',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete_snippet',
        description: 'Delete a code snippet from CodeMenu',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The unique identifier of the snippet to delete',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'search_snippets',
        description: 'Search for code snippets by keyword',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find snippets',
            },
            language: {
              type: 'string',
              description: 'Filter by programming language',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 50)',
            },
          },
          required: ['query'],
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
        const { limit = 50, offset = 0, category } = args;
        let endpoint = `/snippets?limit=${limit}&offset=${offset}`;
        if (category) {
          endpoint += `&category=${encodeURIComponent(category)}`;
        }
        const result = await makeCodeMenuRequest(endpoint);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_snippet': {
        const { id } = args;
        if (!id) {
          throw new Error('Snippet ID is required');
        }
        const result = await makeCodeMenuRequest(`/snippets/${id}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'create_snippet': {
        const { title, code, language, description, category } = args;
        if (!title || !code || !language) {
          throw new Error('Title, code, and language are required');
        }
        const body = { title, code, language };
        if (description) body.description = description;
        if (category) body.category = category;
        
        const result = await makeCodeMenuRequest('/snippets', 'POST', body);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'update_snippet': {
        const { id, title, code, language, description, category } = args;
        if (!id) {
          throw new Error('Snippet ID is required');
        }
        const body = {};
        if (title) body.title = title;
        if (code) body.code = code;
        if (language) body.language = language;
        if (description) body.description = description;
        if (category) body.category = category;

        // Validate that at least one field is provided for update
        if (Object.keys(body).length === 0) {
          throw new Error('At least one field must be provided to update the snippet');
        }

        const result = await makeCodeMenuRequest(`/snippets/${id}`, 'PUT', body);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'delete_snippet': {
        const { id } = args;
        if (!id) {
          throw new Error('Snippet ID is required');
        }
        await makeCodeMenuRequest(`/snippets/${id}`, 'DELETE');
        return {
          content: [
            {
              type: 'text',
              text: `Successfully deleted snippet with ID: ${id}`,
            },
          ],
        };
      }

      case 'search_snippets': {
        const { query, language, limit = 50 } = args;
        if (!query) {
          throw new Error('Search query is required');
        }
        let endpoint = `/snippets/search?q=${encodeURIComponent(query)}&limit=${limit}`;
        if (language) {
          endpoint += `&language=${encodeURIComponent(language)}`;
        }
        const result = await makeCodeMenuRequest(endpoint);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
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
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
