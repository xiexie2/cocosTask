const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = __dirname;
const BUILD_DIR = path.join(PROJECT_ROOT, 'build', 'web-mobile');
const MRAID_DIR = path.join(PROJECT_ROOT, 'mraid-package');

console.log('========================================');
console.log('🔧 HuaDongQiFei 构建后配置应用工具');
console.log('========================================\n');

function log(message, type = 'info') {
    const colors = {
        info: '\x1b[36m',
        success: '\x1b[32m',
        warning: '\x1b[33m',
        error: '\x1b[31m',
        reset: '\x1b[0m'
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
}

function copyFile(src, dest) {
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        return true;
    }
    return false;
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

log('📋 检查并应用配置...\n');

let successCount = 0;
let failCount = 0;

if (fs.existsSync(BUILD_DIR)) {
    log(`✅ 检测到构建目录: ${BUILD_DIR}`, 'success');
    
    const netlifyConfig = `[[headers]]
  for = "/*.js"
  [headers.values]
    Content-Encoding = "gzip"
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.png"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.atlas"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.json"
  [headers.values]
    Content-Encoding = "gzip"
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.mp3"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"`;

    try {
        fs.writeFileSync(path.join(BUILD_DIR, 'netlify.toml'), netlifyConfig);
        log('✅ 已写入 netlify.toml (Gzip + 缓存)', 'success');
        successCount++;
    } catch (err) {
        log(`❌ 写入 netlify.toml 失败: ${err.message}`, 'error');
        failCount++;
    }

    if (fs.existsSync(MRAID_DIR)) {
        try {
            fs.writeFileSync(path.join(MRAID_DIR, 'netlify.toml'), netlifyConfig);
            log('✅ 已同步 netlify.toml 到 mraid-package/', 'success');
            successCount++;
        } catch (err) {
            log(`❌ 同步失败: ${err.message}`, 'error');
            failCount++;
        }
    }

} else {
    log(`⚠️  构建目录不存在: ${BUILD_DIR}`, 'warning');
    log('   请先在 Cocos Creator 中执行构建\n', 'warning');
}

const configSnapshot = {
    timestamp: new Date().toISOString(),
    project: 'HuaDongQiFei',
    version: '3.8.8',
    configurations: {
        netlify: {
            gzipCompression: true,
            cacheControl: '1 year immutable',
            headers: ['JS', 'PNG', 'Atlas', 'JSON', 'MP3']
        },
        gameFeatures: {
            firstBodyNoButtonSwipe: true,
            loadingScreen: true,
            progressBar: true,
            mraidSupport: true
        },
        optimization: {
            webpConversion: false,
            imageCompression: false,
            spineOptimization: false
        },
        buildTemplates: {
            customIndexEjs: true,
            loadingScreen: 'HuaDongQiFei branded',
            responsiveDesign: true
        }
    },
    filesModified: [
        'assets/Scripts/GameController.ts - 第一个body的NO按钮触发滑动',
        'build-templates/web-mobile/index.ejs - 自定义Loading界面',
        'netlify.toml - Gzip压缩和缓存策略 (根目录)',
        'mraid-package/netlify.toml - Gzip压缩和缓存策略 (部署目录)',
        'OPTIMIZATION_GUIDE.md - 完整优化指南文档'
    ],
    scriptsAvailable: [
        'compress-images.js - PNG/JPG压缩',
        'convert-to-webp.js - WebP格式转换',
        'compress-strong.js - 强力压缩',
        'post-build-config.js - 本脚本 (构建后自动应用配置)',
        'deploy-web.bat - 部署工具',
        'build-mraid.bat - MRAID广告构建'
    ]
};

try {
    fs.writeFileSync(
        path.join(PROJECT_ROOT, 'config-snapshot.json'),
        JSON.stringify(configSnapshot, null, 2)
    );
    log('✅ 已生成配置快照: config-snapshot.json', 'success');
    successCount++;
} catch (err) {
    log(`❌ 生成配置快照失败: ${err.message}`, 'error');
    failCount++;
}

log('\n========================================');
log('📊 配置应用完成！', 'success');
log('========================================');
log(`成功: ${successCount} 项`);
log(`失败: ${failCount} 项\n`);

if (successCount > 0) {
    log('📝 当前已保存的配置:', 'info');
    log('  ✓ 第一个Body的NO按钮 → 触发滑动 (GameController.ts)', 'info');
    log('  ✓ Gzip 压缩 + 1年缓存策略 (netlify.toml)', 'info');
    log('  ✓ 自定义 Loading 界面 (index.ejs)', 'info');
    log('  ✓ MRAID 广告支持', 'info');
    log('\n💡 下次构建后运行此脚本即可恢复所有配置:', 'info');
    log('   node post-build-config.js\n', 'info');
}

process.exit(failCount > 0 ? 1 : 0);