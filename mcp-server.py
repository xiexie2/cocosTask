#!/usr/bin/env python3
"""
Cocos Creator MCP Server
用于 Trae IDE 与 Cocos Creator 编辑器通信
"""

import json
import os
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 3001
PROJECT_PATH = r"E:\Cocos\Hdqf\HuaDongQiFei"

class MCPHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/mcp':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {
                "name": "cocos-mcp-python",
                "version": "1.0.0",
                "capabilities": {
                    "tools": [
                        "get_project_info",
                        "list_scenes", 
                        "list_scripts",
                        "get_asset_info"
                    ]
                }
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'OK')
    
    def do_POST(self):
        if self.path == '/tools':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            result = self.handle_tool(data)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def handle_tool(self, data):
        tool_name = data.get('name')
        args = data.get('arguments', {})
        
        if tool_name == 'get_project_info':
            return self.get_project_info()
        elif tool_name == 'list_scenes':
            return self.list_scenes()
        elif tool_name == 'list_scripts':
            return self.list_scripts()
        else:
            return {"success": False, "error": f"Unknown tool: {tool_name}"}
    
    def get_project_info(self):
        package_json = os.path.join(PROJECT_PATH, 'package.json')
        try:
            with open(package_json, 'r', encoding='utf-8') as f:
                pkg = json.load(f)
            return {
                "success": True,
                "data": {
                    "name": pkg.get('name', 'Unknown'),
                    "uuid": pkg.get('uuid', 'Unknown'),
                    "version": pkg.get('creator', {}).get('version', 'Unknown'),
                    "path": PROJECT_PATH
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def list_scenes(self):
        scenes_path = os.path.join(PROJECT_PATH, 'assets', 'Scenes')
        try:
            files = os.listdir(scenes_path)
            scenes = [f.replace('.scene', '') for f in files if f.endswith('.scene')]
            return {"success": True, "data": scenes}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def list_scripts(self):
        scripts_path = os.path.join(PROJECT_PATH, 'assets', 'Scripts')
        try:
            files = os.listdir(scripts_path)
            scripts = [f.replace('.ts', '') for f in files if f.endswith('.ts')]
            return {"success": True, "data": scripts}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def log_message(self, format, *args):
        print(f"[MCP] {args[0]}")

def run_server():
    server = HTTPServer(('127.0.0.1', PORT), MCPHandler)
    print(f"✅ Cocos MCP Python Server running on http://127.0.0.1:{PORT}/mcp")
    print(f"📂 Project: {PROJECT_PATH}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        server.shutdown()

if __name__ == '__main__':
    run_server()
