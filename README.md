# codemenu-mcp

MCP server for CodeMenu snippet manager.

## Overview

This is a Model Context Protocol (MCP) server that provides integration with the CodeMenu local HTTP API, allowing AI assistants to access and search through code snippets stored in CodeMenu.

## Features

The server exposes the following tools for interacting with CodeMenu:

- **list_snippets** - List snippets without full code content (to reduce token usage). Returns id, title, description, language, abbreviation, tags, and group info. Supports filtering by query, language, tag, or group.
- **get_snippet** - Retrieve the full details of a specific snippet by ID, including complete code content
- **list_tags** - List all available tags in CodeMenu
- **list_groups** - List all available groups in CodeMenu

## Prerequisites

- **CodeMenu** application must be running on your system
- **API must be enabled** in CodeMenu settings (CodeMenu → Settings → API)
- Node.js >= 18.0.0

## CodeMenu API Setup

1. Open CodeMenu application
2. Go to Settings → API
3. Enable the API server
4. Note the port (default: 1300)
5. Optionally, set an API key for authentication

The CodeMenu API runs locally at `http://127.0.0.1:1300/v1` by default.

## Installation

### From npm (when published)

```bash
npm install -g git+https://github.com/Extiri/codemenu-mcp.git
```

### From source

```bash
git clone https://github.com/Extiri/codemenu-mcp.git
cd codemenu-mcp
npm install
npm link
```

## Configuration

The server connects to the local CodeMenu API and supports the following environment variables:

### Environment Variables

- `CODEMENU_API_URL` - The base URL for the CodeMenu API (default: `http://127.0.0.1:1300/v1`)
- `CODEMENU_API_KEY` - Your CodeMenu API key if you enabled key protection in settings (optional)

### Example Configuration for Claude Desktop

Add this to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "codemenu": {
      "command": "node",
      "args": ["/path/to/codemenu-mcp/index.js"],
      "env": {
        "CODEMENU_API_URL": "http://127.0.0.1:1300/v1",
        "CODEMENU_API_KEY": "your-api-key-if-enabled"
      }
    }
  }
}
```

Or if installed globally via npm:

```json
{
  "mcpServers": {
    "codemenu": {
      "command": "codemenu-mcp",
      "env": {
        "CODEMENU_API_KEY": "your-api-key-if-enabled"
      }
    }
  }
}
```

**Note**: If you didn't enable API key protection in CodeMenu settings, you can omit the `CODEMENU_API_KEY` environment variable.

## Usage

Once configured, the server will be automatically started by your MCP client (e.g., Claude Desktop). The AI assistant will have access to your CodeMenu snippets and can:

- Browse and search through your code snippets
- Find snippets by language, tags, or groups
- Retrieve specific snippets with full code content when needed
- List available tags and groups for better organization

### Example Interactions

**Searching snippets:**
```
"Search my CodeMenu snippets for sorting algorithms"
```

**Listing snippets by language:**
```
"Show me all my JavaScript snippets from CodeMenu"
```

**Getting a specific snippet:**
```
"Show me the full code for snippet ID ABC123"
```

**Listing tags:**
```
"What tags do I have in CodeMenu?"
```

## Development

### Running the Server

```bash
npm start
```

The server communicates over stdio, which is the standard transport for MCP servers.

### Testing

```bash
npm test
```

This validates that the server correctly implements the MCP protocol. To test actual API calls, make sure CodeMenu is running with the API enabled.

### Project Structure

- `index.js` - Main server implementation
- `package.json` - Project metadata and dependencies
- `test.js` - MCP protocol test suite
- `README.md` - This file
- `LICENSE` - MIT license
- `.gitignore` - Files to exclude from git

## API Reference

The server implements the Model Context Protocol and exposes tools that correspond to CodeMenu API endpoints:

- `GET /snippets` - List snippets with optional filters (query, language, tag, group)
- `GET /tags` - List all tags
- `GET /groups` - List all groups

For detailed information about the CodeMenu API, refer to the [CodeMenu API documentation](https://docs.extiri.com/CodeMenuAPI).

## Token Usage Optimization

The `list_snippets` tool intentionally excludes the full code content from results to reduce token usage. This allows you to:

1. Browse through many snippets efficiently
2. Use `get_snippet` only when you need the actual code content
3. Reduce costs when working with LLM APIs

## Requirements

- Node.js >= 18.0.0
- CodeMenu application with API enabled
- MCP client (e.g., Claude Desktop)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues related to:
- This MCP server: Open an issue on GitHub
- CodeMenu application or API: Refer to the CodeMenu documentation
- MCP specification: See the [Model Context Protocol documentation](https://modelcontextprotocol.io)

## Troubleshooting

**Server can't connect to CodeMenu:**
- Ensure CodeMenu application is running
- Check that API is enabled in CodeMenu settings
- Verify the port matches your configuration (default: 1300)
- If you enabled API key protection, ensure `CODEMENU_API_KEY` is set correctly

**No snippets returned:**
- Verify you have snippets in CodeMenu
- Check that your search filters aren't too restrictive
- Try listing without filters first

**Authentication errors:**
- If you enabled API key protection in CodeMenu, set the `CODEMENU_API_KEY` environment variable
- If you didn't enable it, make sure the environment variable is not set or is empty
