# codemenu-mcp

MCP server for CodeMenu snippet manager.

## Overview

This is a Model Context Protocol (MCP) server that provides integration with the CodeMenu API, allowing AI assistants to manage code snippets through standardized tools.

## Features

The server exposes the following tools for interacting with CodeMenu:

- **list_snippets** - List all code snippets with optional filtering and pagination
- **get_snippet** - Retrieve a specific snippet by ID
- **create_snippet** - Create a new code snippet
- **update_snippet** - Update an existing snippet
- **delete_snippet** - Delete a snippet
- **search_snippets** - Search for snippets by keyword

## Installation

### From npm (when published)

```bash
npm install -g codemenu-mcp
```

### From source

```bash
git clone https://github.com/Extiri/codemenu-mcp.git
cd codemenu-mcp
npm install
npm link
```

## Configuration

The server requires configuration of the CodeMenu API endpoint and authentication:

### Environment Variables

- `CODEMENU_API_URL` - The base URL for the CodeMenu API (default: `https://api.codemenu.io/v1`)
- `CODEMENU_API_KEY` - Your CodeMenu API key for authentication (optional, depending on API requirements)

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
        "CODEMENU_API_URL": "https://api.codemenu.io/v1",
        "CODEMENU_API_KEY": "your-api-key-here"
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
        "CODEMENU_API_URL": "https://api.codemenu.io/v1",
        "CODEMENU_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Usage

Once configured, the server will be automatically started by your MCP client (e.g., Claude Desktop). The AI assistant will have access to the CodeMenu tools and can:

- List and browse your code snippets
- Create new snippets from conversations
- Search for specific snippets
- Update existing snippets
- Delete snippets

### Example Interactions

**Creating a snippet:**
```
"Save this Python function as a snippet in CodeMenu"
```

**Finding a snippet:**
```
"Search my CodeMenu snippets for sorting algorithms"
```

**Listing snippets:**
```
"Show me all my JavaScript snippets from CodeMenu"
```

## Development

### Running the Server

```bash
npm start
```

The server communicates over stdio, which is the standard transport for MCP servers.

### Project Structure

- `index.js` - Main server implementation
- `package.json` - Project metadata and dependencies
- `README.md` - This file

## API Reference

The server implements the Model Context Protocol and exposes tools that correspond to CodeMenu API endpoints. Refer to the [CodeMenu API documentation](https://docs.extiri.com/CodeMenuAPI) for detailed information about the underlying API.

## Requirements

- Node.js >= 18.0.0
- CodeMenu API access (API key if required)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues related to:
- This MCP server: Open an issue on GitHub
- CodeMenu API: Refer to the CodeMenu documentation
- MCP specification: See the [Model Context Protocol documentation](https://modelcontextprotocol.io)

