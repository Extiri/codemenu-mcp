#!/usr/bin/env node

/**
 * Simple test script to verify the MCP server is working correctly
 * This sends basic MCP protocol messages to test the server's responses
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';

console.log('Starting CodeMenu MCP Server Test...\n');

const server = spawn('node', ['index.js'], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

const rl = createInterface({
  input: server.stdout,
});

let responseCount = 0;
const expectedResponses = 2;

rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    responseCount++;
    
    if (response.id === 1) {
      console.log('✓ Initialize response received');
      console.log('  Protocol version:', response.result.protocolVersion);
      console.log('  Server name:', response.result.serverInfo.name);
      console.log('  Server version:', response.result.serverInfo.version);
    } else if (response.id === 2) {
      console.log('\n✓ Tools list response received');
      console.log('  Number of tools:', response.result.tools.length);
      console.log('\n  Available tools:');
      response.result.tools.forEach(tool => {
        console.log(`    - ${tool.name}: ${tool.description}`);
      });
    }
    
    if (responseCount >= expectedResponses) {
      console.log('\n✓ All tests passed!');
      console.log('\nNote: This test only validates MCP protocol communication.');
      console.log('To test actual API calls, ensure CodeMenu is running with API enabled.');
      server.kill();
      process.exit(0);
    }
  } catch (error) {
    // Ignore non-JSON lines (like stderr output)
  }
});

// Send test messages
const initMessage = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0',
    },
  },
};

const toolsListMessage = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
};

// Send messages to server
server.stdin.write(JSON.stringify(initMessage) + '\n');
server.stdin.write(JSON.stringify(toolsListMessage) + '\n');

// Timeout after 5 seconds
setTimeout(() => {
  console.error('\n✗ Test timeout - server did not respond in time');
  server.kill();
  process.exit(1);
}, 5000);

server.on('error', (error) => {
  console.error('✗ Server error:', error);
  process.exit(1);
});
