@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 Cocos MCP Server
echo ========================================
echo.
echo 正在启动服务器...
echo.
node "%~dp0mcp-server.js"
echo.
echo ========================================
echo 服务器已停止
echo ========================================
pause
