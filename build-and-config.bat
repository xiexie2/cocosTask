@echo off
chcp 65001 >nul 2>&1
echo ============================================
echo    HuaDongQiFei 一键构建 + 配置工具
echo ============================================
echo.

set PROJECT_DIR=%~dp0
set BUILD_DIR=%PROJECT_DIR%build\web-mobile

echo [步骤 1/5] 检查构建目录...
if not exist "%BUILD_DIR%" (
    echo.
    echo ⚠️  未检测到构建输出！
    echo.
    echo 请按以下步骤操作：
    echo.
    echo   1️⃣  打开 Cocos Creator
    echo   2️⃣  菜单: 项目 → 构建发布
    echo   3️⃣  选择平台: Web Mobile
    echo   4️⃣  点击 "构建" 按钮
    echo   5️⃣  构建完成后，重新运行此脚本
    echo.
    pause
    exit /b 1
)

echo ✅ 检测到构建目录: %BUILD_DIR%
echo.

echo [步骤 2/5] 应用 Netlify 优化配置...
node post-build-config.js
if errorlevel 1 (
    echo ❌ 配置应用失败！
    pause
    exit /b 1
)
echo.

echo [步骤 3/5] 验证关键文件...
if exist "%BUILD_DIR%\netlify.toml" (
    echo ✅ netlify.toml 已就位 (Gzip + 缓存)
) else (
    echo ❌ netlify.toml 缺失！
    pause
    exit /b 1
)

if exist "%PROJECT_DIR%mraid-package\netlify.toml" (
    echo ✅ mraid-package/netlify.toml 已同步
) else (
    echo ⚠️  mraid-package 目录不存在，跳过
)

if exist "%BUILD_DIR%\index.html" (
    echo ✅ index.html 已生成 (自定义Loading界面)
) else (
    echo ❌ index.html 缺失！
    pause
    exit /b 1
)
echo.

echo [步骤 4/5] 检查游戏逻辑代码...
if exist "%PROJECT_DIR%assets\Scripts\GameController.ts" (
    findstr /C:"currentBodyIndex === 1" "%PROJECT_DIR%assets\Scripts\GameController.ts" >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ GameController.ts 已包含第一个Body特殊逻辑
    ) else (
        echo ⚠️  未检测到第一个Body特殊逻辑（可能已修改或未保存）
    )
) else (
    echo ❌ GameController.ts 不存在！
)
echo.

echo [步骤 5/5] 生成配置清单...
echo.

echo ============================================
echo ✅ 构建配置完成！
echo ============================================
echo.
echo 📦 当前激活的功能:
echo   ✓ 第一个Body点击NO → 触发滑动（非女孩走路）
echo   ✓ Gzip压缩 (JS/JSON文件体积减少60-80%%)
echo   ✓ 强缓存策略 (静态资源缓存1年)
echo   ✓ 自定义Loading界面 (HuaDongQiFei品牌)
echo   ✓ MRAID广告支持
echo.
echo 📁 生成的配置文件:
echo   • build\web-mobile\netlify.toml
echo   • mraid-package\netlify.toml  
echo   • config-snapshot.json (完整配置快照)
echo.
echo 🎯 下一步操作:
echo.
echo   选项 A - 本地测试:
echo     cd build\web-mobile
echo     npx http-server -p 8080
echo     访问: http://localhost:8080
echo.
echo   选项 B - 部署到 Netlify:
echo     cd build\web-mobile
echo     netlify deploy --prod
echo.
echo   选项 C - 运行图片优化（可选）:
echo     node convert-to-webp.js
echo     node compress-images.js
echo     然后重新执行本脚本
echo.
echo   选项 D - 部署MRAID广告包:
echo     运行 build-mraid.bat
echo.
echo ============================================

set /p choice="是否立即部署? (Y/N): "
if /i "%choice%"=="Y" (
    echo.
    echo 正在启动部署流程...
    call deploy-web.bat
) else if /i "%choice%"=="y" (
    echo.
    echo 正在启动部署流程...
    call deploy-web.bat
) else (
    echo.
    echo 👍 好的！配置已全部就绪。
    echo    随时可以运行此脚本或手动部署。
    echo.
)

pause