const http = require('http');

console.log('🧪 Testing Cocos MCP Server...\n');

// 测试 GET /mcp
function testGetMcp() {
  return new Promise((resolve) => {
    console.log('📡 Testing GET /mcp...');
    http.get('http://127.0.0.1:3000/mcp', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Response:', JSON.parse(data));
        console.log();
        resolve();
      });
    }).on('error', (e) => {
      console.log('❌ Error:', e.message);
      resolve();
    });
  });
}

// 测试 POST /tools
function testPostTools() {
  return new Promise((resolve) => {
    console.log('📡 Testing POST /tools (get_project_info)...');
    const postData = JSON.stringify({ name: 'get_project_info' });
    
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/tools',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Response:', JSON.parse(data));
        console.log();
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log('❌ Error:', e.message);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('⏳ Waiting 2 seconds for server to start...\n');
  await new Promise(r => setTimeout(r, 2000));
  
  await testGetMcp();
  await testPostTools();
  
  console.log('✅ All tests completed!');
  console.log('\n💡 Tip: Server is still running. Press Ctrl+C to stop.');
}

runTests();
