@echo off
chcp 65001 >nul
echo ========================================
echo 🧪 Cocos MCP Server 测试
echo ========================================
echo.
echo 1️⃣  正在启动服务器...
start /B node "%~dp0extensions\cocos-mcp-server\main.js"
timeout /t 3 /nobreak >nul
echo ✅ 服务器已启动！
echo.
echo 2️⃣  运行测试客户端...
node "%~dp0test-mcp.js"
echo.
echo ========================================
echo 📌 提示：
echo - 服务器运行在 http://127.0.0.1:3000
echo - 按 Ctrl+C 停止服务器
echo - 在 Cocos Creator 中可直接使用扩展
echo ========================================
