@echo off
chcp 65001 >nul
echo ========================================
echo    Cocos Creator Web 部署工具
echo ========================================
echo.

set BUILD_DIR=build\web-mobile

if not exist %BUILD_DIR% (
    echo [错误] 请先在 Cocos Creator 中构建 Web 平台！
    echo 路径: 项目 ^> 构建发布 ^> Web Mobile ^> 构建
    pause
    exit /b 1
)

echo [1] 检测到构建目录: %BUILD_DIR%
echo.

echo 请选择部署方式:
echo [1] 本地预览 (http-server)
echo [2] 部署到 Netlify
echo [3] 部署到 Vercel
echo [4] 使用 ngrok 生成临时链接
echo.

set /p choice="请输入选项 (1-4): "

if "%choice%"=="1" goto local_preview
if "%choice%"=="2" goto deploy_netlify
if "%choice%"=="3" goto deploy_vercel
if "%choice%"=="4" goto deploy_ngrok
echo 无效选项
pause
exit /b 1

:local_preview
echo.
echo [启动本地服务器]
echo 访问地址: http://localhost:8080
echo 按 Ctrl+C 停止服务器
echo.
cd %BUILD_DIR%
npx http-server -p 8080 -c-1
pause
exit /b 0

:deploy_netlify
echo.
echo [部署到 Netlify]
echo 正在检查 Netlify CLI...
npx netlify --version >nul 2>&1
if errorlevel 1 (
    echo 正在安装 Netlify CLI...
    npm install -g netlify-cli
)
echo.
echo 请确保已登录 Netlify (netlify login)
echo.
cd %BUILD_DIR%
netlify deploy --prod
pause
exit /b 0

:deploy_vercel
echo.
echo [部署到 Vercel]
echo 正在检查 Vercel CLI...
npx vercel --version >nul 2>&1
if errorlevel 1 (
    echo 正在安装 Vercel CLI...
    npm install -g vercel
)
echo.
cd %BUILD_DIR%
vercel --prod
pause
exit /b 0

:deploy_ngrok
echo.
echo [使用 ngrok 生成临时链接]
echo 请确保已安装 ngrok: https://ngrok.com/download
echo.
echo 正在启动本地服务器...
start "" npx http-server %BUILD_DIR% -p 8080
timeout /t 2 >nul
echo.
echo 请在新终端运行: ngrok http 8080
echo 然后将生成的链接分享给他人
echo.
pause
exit /b 0
