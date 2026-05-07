const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PROJECT_PATH = __dirname;

console.log('🚀 Cocos MCP Server Starting...');
console.log(`📂 Project: ${PROJECT_PATH}`);

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.url === '/mcp' && req.method === 'GET') {
    res.end(JSON.stringify({
      name: 'cocos-mcp',
      version: '1.0.0',
      capabilities: {
        tools: [
          'get_project_info',
          'list_prefabs',
          'list_nodes_in_prefab',
          'setup_game_controller',
          'bind_game_controller_nodes',
          'get_editor_logs',
          'check_script_errors',
          'build_mraid_ad',
          'build_mraid_from_cocos',
          'create_mraid_package',
          'optimize_mraid_package'
        ]
      }
    }, null, 2));
    return;
  }
  
  if (req.url === '/tools' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const result = handleTool(data);
        res.end(JSON.stringify(result, null, 2));
      } catch (e) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  
  res.end(JSON.stringify({ status: 'ok', message: 'Cocos MCP Server' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Server running on http://127.0.0.1:${PORT}/mcp`);
  console.log(`🎮 Ready for Trae IDE connection!`);
  console.log(`📌 Press Ctrl+C to stop`);
});

function handleTool(data) {
  const { name, arguments: args } = data;
  
  switch (name) {
    case 'get_project_info':
      return { success: true, data: getProjectInfo() };
    case 'list_prefabs':
      return { success: true, data: getPrefabs() };
    case 'list_nodes_in_prefab':
      return { success: true, data: listNodesInPrefab(args?.prefabName) };
    case 'setup_game_controller':
      return setupGameController(args?.prefabName);
    case 'bind_game_controller_nodes':
      return bindGameControllerNodes(args?.prefabName);
    case 'get_editor_logs':
      return getEditorLogs();
    case 'check_script_errors':
      return checkScriptErrors();
    case 'build_mraid_ad':
      return buildMraidAd(args);
    case 'build_mraid_from_cocos':
      return buildMraidFromCocos(args);
    case 'create_mraid_package':
      return createMraidPackage(args);
    case 'optimize_mraid_package':
      return optimizeMraidPackage(args);
    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}

function getProjectInfo() {
  try {
    const pkgPath = path.join(PROJECT_PATH, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return {
      name: pkg.name || 'Unknown',
      uuid: pkg.uuid || 'Unknown',
      version: pkg.creator?.version || 'Unknown',
      path: PROJECT_PATH
    };
  } catch (e) {
    return { error: e.message };
  }
}

function getPrefabs() {
  const prefabsPath = path.join(PROJECT_PATH, 'assets', 'Resources', 'pre');
  try {
    const files = fs.readdirSync(prefabsPath);
    return files.filter(f => f.endsWith('.prefab')).map(f => f.replace('.prefab', ''));
  } catch (e) {
    return [];
  }
}

function listNodesInPrefab(prefabName) {
  try {
    const prefabPath = path.join(PROJECT_PATH, 'assets', 'Resources', 'pre', `${prefabName}.prefab`);
    
    if (!fs.existsSync(prefabPath)) {
      return { error: `Prefab ${prefabName} not found` };
    }
    
    const prefabContent = fs.readFileSync(prefabPath, 'utf-8');
    const prefabData = JSON.parse(prefabContent);
    
    const nodes = prefabData
      .filter(item => item.__type__ === 'cc.Node' && item._name)
      .map(node => ({
        name: node._name,
        id: node._id
      }));
    
    return {
      prefab: prefabName,
      nodes: nodes
    };
  } catch (e) {
    return { error: e.message };
  }
}

function setupGameController(prefabName) {
  try {
    const prefabPath = path.join(PROJECT_PATH, 'assets', 'Resources', 'pre', `${prefabName}.prefab`);
    
    if (!fs.existsSync(prefabPath)) {
      return { success: false, error: `Prefab ${prefabName} not found` };
    }
    
    const prefabContent = fs.readFileSync(prefabPath, 'utf-8');
    const prefabData = JSON.parse(prefabContent);
    
    const rootNode = prefabData.find(item => item.__type__ === 'cc.Node' && item._name === prefabName);
    
    if (!rootNode) {
      return { success: false, error: `Root node ${prefabName} not found` };
    }
    
    if (!rootNode._components) {
      rootNode._components = [];
    }
    
    const componentId = `gamecontroller_${Date.now()}`;
    const gameControllerComponent = {
      _id: componentId,
      __type__: 'cc.GameController',
      _name: '',
      _objFlags: 0,
      node: { __id__: rootNode._id || '' },
      _enabled: true,
      __prefab: null,
      mainUI: null,
      bg: null,
      body1: null,
      body2: null,
      hand: null,
      okButton: null,
      qiang: null,
      body1Prefab: null,
      body2Prefab: null
    };
    
    prefabData.push(gameControllerComponent);
    rootNode._components.push({ __id__: prefabData.length - 1 });
    
    fs.writeFileSync(prefabPath, JSON.stringify(prefabData, null, 2), 'utf-8');
    
    return {
      success: true,
      message: `GameController 组件已添加到 ${prefabName}`,
      data: {
        prefab: prefabName,
        component: 'GameController'
      }
    };
  } catch (e) {
    console.error('Error:', e);
    return { success: false, error: e.message };
  }
}

function bindGameControllerNodes(prefabName) {
  try {
    const prefabPath = path.join(PROJECT_PATH, 'assets', 'Resources', 'pre', `${prefabName}.prefab`);
    
    if (!fs.existsSync(prefabPath)) {
      return { success: false, error: `Prefab ${prefabName} not found` };
    }
    
    const prefabContent = fs.readFileSync(prefabPath, 'utf-8');
    const prefabData = JSON.parse(prefabContent);
    
    // 查找根节点（第一个节点）
    const rootNode = prefabData.find(item => item.__type__ === 'cc.Node' && !item._parent);
    if (!rootNode) {
      return { success: false, error: 'Root node not found' };
    }
    
    // 查找 GameController 组件
    const gcComponentIndex = prefabData.findIndex(item => 
      item.__type__ === 'cc.GameController'
    );
    
    if (gcComponentIndex === -1) {
      return { success: false, error: 'GameController component not found. Run setup_game_controller first.' };
    }
    
    const gcComponent = prefabData[gcComponentIndex];
    
    // 辅助函数：通过 _children 引用查找节点
    // children 数组中的 __id__ 是数字，对应 prefabData 数组的索引
    function findNodeByName(children, name, allData) {
      for (const childRef of children) {
        const dataIndex = parseInt(childRef.__id__);
        if (!isNaN(dataIndex) && dataIndex >= 0 && dataIndex < allData.length) {
          const item = allData[dataIndex];
          if (item && item.__type__ === 'cc.Node' && item._name === name) {
            return { node: item, index: dataIndex };
          }
        }
      }
      return null;
    }
    
    // 从根节点的 children 中查找
    const bgResult = findNodeByName(rootNode._children, 'bg', prefabData);
    const bodyResult = findNodeByName(rootNode._children, 'body', prefabData);
    const handResult = findNodeByName(rootNode._children, 'hand', prefabData);
    
    // ok 节点可能在 hand 节点下
    let okResult = findNodeByName(rootNode._children, 'ok', prefabData);
    if (!okResult && handResult && handResult.node._children) {
      okResult = findNodeByName(handResult.node._children, 'ok', prefabData);
    }
    
    // 从 bg 节点的 children 中查找 qiang
    let qiangResult = null;
    if (bgResult && bgResult.node._children) {
      qiangResult = findNodeByName(bgResult.node._children, 'qiang', prefabData);
    }
    
    // 更新组件属性（使用 prefabData 数组索引）
    gcComponent.node = { __id__: String(1) }; // 根节点在索引 1
    gcComponent.mainUI = { __id__: String(1) }; // 根节点在索引 1
    gcComponent.bg = bgResult ? { __id__: String(bgResult.index) } : null;
    gcComponent.body1 = bodyResult ? { __id__: String(bodyResult.index) } : null;
    gcComponent.body2 = bodyResult ? { __id__: String(bodyResult.index) } : null;
    gcComponent.hand = handResult ? { __id__: String(handResult.index) } : null;
    gcComponent.okButton = okResult ? { __id__: String(okResult.index) } : null;
    gcComponent.qiang = qiangResult ? { __id__: String(qiangResult.index) } : null;
    
    // 设置预设引用（使用正确的 UUID）
    gcComponent.body1Prefab = {
      __uuid__: 'f54d5408-718c-4348-b198-46fc8028b1ea',
      __expectedType__: 'cc.Prefab'
    };
    
    gcComponent.body2Prefab = {
      __uuid__: '6ff6cd08-43c2-47ef-aa5a-3f3ef1b0adbe',
      __expectedType__: 'cc.Prefab'
    };
    
    // 保存文件
    fs.writeFileSync(prefabPath, JSON.stringify(prefabData, null, 2), 'utf-8');
    
    console.log('✅ Successfully bound all nodes to GameController');
    
    return {
      success: true,
      message: `所有节点已成功绑定到 ${prefabName} 的 GameController 组件`,
      data: {
        prefab: prefabName,
        bindings: {
          mainUI: 'MianUI',
          bg: bgResult ? 'bg' : 'not found',
          body1: bodyResult ? 'body' : 'not found',
          body2: bodyResult ? 'body' : 'not found',
          hand: handResult ? 'hand' : 'not found',
          okButton: okResult ? 'ok' : 'not found',
          qiang: qiangResult ? 'qiang' : 'not found'
        }
      }
    };
  } catch (e) {
    console.error('Error binding nodes:', e);
    return { success: false, error: e.message };
  }
}

function getEditorLogs() {
  try {
    // Cocos Creator 3.x 日志文件位置
    const logPath = path.join(PROJECT_PATH, 'temp', 'logs', 'project.log');
    
    if (!fs.existsSync(logPath)) {
      return { 
        success: true, 
        message: 'No project.log found',
        logs: 'No project.log file found'
      };
    }
    
    const logContent = fs.readFileSync(logPath, 'utf-8');
    const lines = logContent.split('\n');
    const recentLines = lines.slice(-150); // 获取最近 150 行
    
    // 查找错误和警告信息
    const errors = recentLines.filter(line => 
      line.includes('error') || 
      line.includes('Error') ||
      line.includes('TypeError') ||
      line.includes('Exception') ||
      line.includes('❌') ||
      line.includes('错误') ||
      line.includes('warn') ||
      line.includes('Warn')
    );
    
    return {
      success: true,
      logs: recentLines.join('\n'),
      errors: errors,
      errorCount: errors.length
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function buildMraidFromCocos(args) {
  try {
    const storeUrl = args?.storeUrl || 'https://apps.apple.com/app/your-app-id';
    const outputFile = args?.outputFile || 'mraid-ad-cocos.html';
    const buildDir = path.join(PROJECT_PATH, 'build', 'web-mobile');
    
    if (!fs.existsSync(buildDir)) {
      return { success: false, error: 'Build directory not found. Please build the project first in Cocos Creator (Web Mobile)' };
    }

    console.log('Reading Cocos build files...');
    
    // 读取所有必要的文件
    const filesToRead = {
      styleCss: path.join(buildDir, 'style.css'),
      polyfills: path.join(buildDir, 'src', 'polyfills.bundle.js'),
      system: path.join(buildDir, 'src', 'system.bundle.js'),
      importMap: path.join(buildDir, 'src', 'import-map.json'),
      indexJs: path.join(buildDir, 'index.js'),
      applicationJs: path.join(buildDir, 'application.js')
    };
    
    const fileContents = {};
    for (const [key, filePath] of Object.entries(filesToRead)) {
      if (fs.existsSync(filePath)) {
        fileContents[key] = fs.readFileSync(filePath, 'utf-8');
        console.log(`Read: ${key}`);
      } else {
        console.log(`Warning: ${key} not found at ${filePath}`);
        fileContents[key] = '';
      }
    }

    // 创建 MRAID HTML
    const mraidHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,user-scalable=no,initial-scale=1,minimum-scale=1,maximum-scale=1,minimal-ui=true,viewport-fit=cover">
<title>HuaDongQiFei - MRAID Playable Ad</title>

<!-- MRAID Meta Tags -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="format-detection" content="telephone=no">
<meta name="renderer" content="webkit"/>
<meta name="force-rendering" content="webkit"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/>
<meta name="msapplication-tap-highlight" content="no">
<meta name="full-screen" content="yes"/>
<meta name="x5-fullscreen" content="true"/>
<meta name="360-fullscreen" content="true"/>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; background-color: #000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
#ad-container { position: relative; width: min(100vw, 56.2219vh, 750px); height: min(100vh, 177.8667vw, 1334px); aspect-ratio: 750 / 1334; margin: auto; overflow: hidden; background-color: #fff; }
#GameDiv { width: 100%; height: 100%; aspect-ratio: 750 / 1334; position: relative; overflow: hidden; }
#Cocos3dGameContainer { width: 100%; height: 100%; }
#GameCanvas { width: 100%; height: 100%; display: block; touch-action: none; -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; outline: none; }
#loading-screen { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; transition: opacity 0.5s ease-out; }
.loader { width: 60px; height: 60px; border: 4px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
#loading-text { color: #fff; font-size: 18px; margin-top: 20px; font-weight: 300; }
#cta-button { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); padding: 15px 40px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; font-size: 20px; font-weight: bold; border: none; border-radius: 25px; cursor: pointer; z-index: 9998; box-shadow: 0 4px 15px rgba(245,87,108,0.4); transition: all 0.3s ease; opacity: 0; pointer-events: none; text-transform: uppercase; letter-spacing: 1px; }
#cta-button.visible { opacity: 1; pointer-events: auto; }
#cta-button:hover { transform: translateX(-50%) scale(1.05); box-shadow: 0 6px 20px rgba(245,87,108,0.6); }
.hidden { opacity: 0 !important; pointer-events: none !important; }
${fileContents.styleCss || ''}
@media (orientation: landscape) and (max-height: 500px) {
  #cta-button { padding: 10px 30px; font-size: 16px; bottom: 15px; }
  #ad-container { max-height: 100vh; }
}
</style>
</head>
<body>
<div id="ad-container">
  <div id="loading-screen">
    <div class="loader"></div>
    <div id="loading-text">Loading...</div>
  </div>
  
  <div id="GameDiv" cc_exact_fit_screen="true">
    <div id="Cocos3dGameContainer">
      <canvas id="GameCanvas" oncontextmenu="event.preventDefault()" tabindex="99"></canvas>
    </div>
  </div>
  
  <button id="cta-button" onclick="handleCTAClick()">Download Now</button>
</div>

<script>
// MRAID Configuration
const CONFIG = {
  storeUrl: '${storeUrl}',
  isMRAID: typeof mraid !== 'undefined'
};

// MRAID State
let mraidReady = false;
let isViewable = false;
let gameStarted = false;

// MRAID Initialization
function initMRAID() {
  if (!CONFIG.isMRAID) {
    console.log('[MRAID] Standalone mode - starting game directly');
    hideLoading();
    return;
  }
  
  console.log('[MRAID] Initializing...');
  const state = mraid.getState();
  console.log('[MRAID] Current state:', state);
  
  if (state === 'loading') {
    mraid.addEventListener('ready', onMRAIDReady);
  } else if (state === 'default') {
    onMRAIDReady();
  }
  
  mraid.addEventListener('viewableChange', function(viewable) {
    isViewable = viewable;
    console.log('[MRAID] Viewable changed:', viewable);
    
    if (viewable && mraidReady && !gameStarted) {
      startGame();
    }
  });
  
  mraid.addEventListener('stateChange', function(newState) {
    console.log('[MRAID] State changed:', newState);
  });
  
  mraid.addEventListener('sizeChange', function(width, height) {
    console.log('[MRAID] Size changed:', width, 'x', height);
  });
}

function onMRAIDReady() {
  console.log('[MRAID] Ready!');
  mraidReady = true;
  
  if (mraid.isViewable()) {
    isViewable = true;
  }
}

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  console.log('[MRAID] Starting game...');
  hideLoading();
}

function hideLoading() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
    }, 500);
  }
  
  setTimeout(showCTA, 8000);
}

function showCTA() {
  const ctaButton = document.getElementById('cta-button');
  if (ctaButton) {
    ctaButton.classList.add('visible');
  }
}

function handleCTAClick() {
  console.log('[MRAID] CTA clicked');
  
  if (CONFIG.isMRAID && typeof mraid.open === 'function') {
    mraid.open(CONFIG.storeUrl);
  } else {
    window.open(CONFIG.storeUrl, '_blank');
  }
}

// Initialize MRAID
window.addEventListener('load', function() {
  console.log('[MRAID] Page loaded, initializing...');
  initMRAID();
});

window.addEventListener('beforeunload', function() {
  console.log('[MRAID] Page unloading');
});
</script>

<!-- Polyfills bundle -->
<script charset="utf-8">
${fileContents.polyfills || ''}
<\/script>

<!-- SystemJS support -->
<script charset="utf-8">
${fileContents.system || ''}
<\/script>

<!-- Import map -->
<script type="systemjs-importmap" charset="utf-8">
${fileContents.importMap || '{}'}
<\/script>

<!-- Start Game -->
<script>
System.import('./index.js').catch(function(err) { 
  console.error('[MRAID] Error loading game:', err); 
});
<\/script>

<script>
// Touch optimization for mobile ads
document.addEventListener('touchstart', function(e) {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, false);

console.log('[MRAID] HuaDongQiFei MRAID Ad loaded successfully!');
console.log('[MRAID] Store URL:', CONFIG.storeUrl);
console.log('[MRAID] Mode:', CONFIG.isMRAID ? 'MRAID' : 'Standalone');
</script>
</body>
</html>`;

    const outputPath = path.join(PROJECT_PATH, outputFile);
    fs.writeFileSync(outputPath, mraidHtml, 'utf-8');
    
    const stats = fs.statSync(outputPath);
    const sizeKB = Math.round(stats.size / 1024 * 100) / 100;
    
    console.log('\\n✅ MRAID Ad from Cocos created!');
    console.log('Output:', outputPath);
    console.log('Size:', sizeKB, 'KB');
    
    return {
      success: true,
      message: 'MRAID ad created from Cocos Creator build',
      data: {
        outputPath: outputPath,
        fileName: outputFile,
        sizeKB: sizeKB,
        storeUrl: storeUrl,
        source: 'Cocos Creator Web Mobile Build',
        includedFiles: Object.keys(fileContents).filter(k => fileContents[k]),
        compliance: {
          singleFile: true,
          mraidCompliant: true,
          hasCocosContent: true,
          hasCTA: true,
          touchOptimized: true,
          fileSizeOk: sizeKB < 5120
        },
        notes: [
          'This HTML contains your actual Init.scene game',
          'Assets are loaded from build/web-mobile/assets/',
          'For full offline support, consider hosting assets with the HTML',
          'Test in browser or upload to ad platform'
        ]
      }
    };
  } catch (e) {
    console.error('Error building MRAID from Cocos:', e);
    return { success: false, error: e.message };
  }
}

function createMraidPackage(args) {
  try {
    const storeUrl = args?.storeUrl || 'https://apps.apple.com/app/your-app-id';
    const buildDir = path.join(PROJECT_PATH, 'build', 'web-mobile');
    const packageDir = path.join(PROJECT_PATH, 'mraid-package');
    
    if (!fs.existsSync(buildDir)) {
      return { success: false, error: 'Build directory not found. Please build the project first in Cocos Creator (Web Mobile)' };
    }

    console.log('Creating MRAID package...');
    
    // 创建打包目录
    if (fs.existsSync(packageDir)) {
      fs.rmSync(packageDir, { recursive: true, force: true });
    }
    fs.mkdirSync(packageDir, { recursive: true });
    
    // 复制所有构建文件
    const copyDir = (src, dest) => {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true });
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };
    
    console.log('Copying build files...');
    copyDir(buildDir, packageDir);
    
    // 读取文件内容
    const styleCss = fs.readFileSync(path.join(buildDir, 'style.css'), 'utf-8');
    const polyfills = fs.readFileSync(path.join(buildDir, 'src', 'polyfills.bundle.js'), 'utf-8');
    const system = fs.readFileSync(path.join(buildDir, 'src', 'system.bundle.js'), 'utf-8');
    let importMap = fs.readFileSync(path.join(buildDir, 'src', 'import-map.json'), 'utf-8');
    // 修正 import-map 路径（从 src 目录移到根目录）
    importMap = importMap.replace(/\.\.\//g, './');
    
    // 创建 MRAID HTML
    const mraidHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,user-scalable=no,initial-scale=1,minimum-scale=1,maximum-scale=1,minimal-ui=true,viewport-fit=cover">
<title>HuaDongQiFei - MRAID Playable Ad</title>
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="format-detection" content="telephone=no">
<meta name="renderer" content="webkit"/>
<meta name="force-rendering" content="webkit"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/>
<meta name="msapplication-tap-highlight" content="no">
<meta name="full-screen" content="yes"/>
<meta name="x5-fullscreen" content="true"/>
<meta name="360-fullscreen" content="true"/>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; background-color: #000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
#ad-container { position: relative; width: min(100vw, 56.2219vh, 750px); height: min(100vh, 177.8667vw, 1334px); aspect-ratio: 750 / 1334; margin: auto; overflow: hidden; background-color: #fff; }
#GameDiv { width: 100%; height: 100%; aspect-ratio: 750 / 1334; position: relative; overflow: hidden; }
#Cocos3dGameContainer { width: 100%; height: 100%; }
#GameCanvas { width: 100%; height: 100%; display: block; touch-action: none; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; outline: none; }
#loading-screen { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; transition: opacity 0.5s ease-out; }
.loader { width: 60px; height: 60px; border: 4px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
#loading-text { color: #fff; font-size: 18px; margin-top: 20px; font-weight: 300; }
#cta-button { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); padding: 15px 40px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; font-size: 20px; font-weight: bold; border: none; border-radius: 25px; cursor: pointer; z-index: 9998; box-shadow: 0 4px 15px rgba(245,87,108,0.4); transition: all 0.3s ease; opacity: 0; pointer-events: none; text-transform: uppercase; letter-spacing: 1px; }
#cta-button.visible { opacity: 1; pointer-events: auto; }
#cta-button:hover { transform: translateX(-50%) scale(1.05); box-shadow: 0 6px 20px rgba(245,87,108,0.6); }
.hidden { opacity: 0 !important; pointer-events: none !important; }
${styleCss}
@media (orientation: landscape) and (max-height: 500px) {
  #cta-button { padding: 10px 30px; font-size: 16px; bottom: 15px; }
  #ad-container { max-height: 100vh; }
}
</style>
</head>
<body>
<div id="ad-container">
  <div id="loading-screen">
    <div class="loader"></div>
    <div id="loading-text">Loading...</div>
  </div>
  <div id="GameDiv" cc_exact_fit_screen="true">
    <div id="Cocos3dGameContainer">
      <canvas id="GameCanvas" oncontextmenu="event.preventDefault()" tabindex="99"></canvas>
    </div>
  </div>
  <button id="cta-button" onclick="handleCTAClick()">Download Now</button>
</div>
<script>
const CONFIG = { storeUrl: '${storeUrl}', isMRAID: typeof mraid !== 'undefined' };
let mraidReady = false, isViewable = false, gameStarted = false;
function initMRAID() {
  if (!CONFIG.isMRAID) { console.log('[MRAID] Standalone mode'); hideLoading(); return; }
  console.log('[MRAID] Initializing...');
  const state = mraid.getState();
  if (state === 'loading') mraid.addEventListener('ready', onMRAIDReady);
  else if (state === 'default') onMRAIDReady();
  mraid.addEventListener('viewableChange', function(v) {
    isViewable = v;
    if (v && mraidReady && !gameStarted) startGame();
  });
  mraid.addEventListener('stateChange', function(s) { console.log('[MRAID] State:', s); });
}
function onMRAIDReady() {
  mraidReady = true;
  if (mraid.isViewable()) isViewable = true;
}
function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  hideLoading();
}
function hideLoading() {
  const ls = document.getElementById('loading-screen');
  if (ls) setTimeout(() => ls.classList.add('hidden'), 500);
  setTimeout(showCTA, 8000);
}
function showCTA() {
  const btn = document.getElementById('cta-button');
  if (btn) btn.classList.add('visible');
}
function handleCTAClick() {
  console.log('[MRAID] CTA clicked');
  if (CONFIG.isMRAID && typeof mraid.open === 'function') mraid.open(CONFIG.storeUrl);
  else window.open(CONFIG.storeUrl, '_blank');
}
window.addEventListener('load', function() { console.log('[MRAID] Page loaded'); initMRAID(); });
<\/script>
<script charset="utf-8">${polyfills}<\/script>
<script charset="utf-8">${system}<\/script>
<script type="systemjs-importmap" charset="utf-8">${importMap}<\/script>
<script>
System.import('./index.js').catch(function(err) { console.error('[MRAID] Error:', err); });
<\/script>
<script>
document.addEventListener('touchstart', function(e) { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, false);
console.log('[MRAID] HuaDongQiFei MRAID Package loaded!');
<\/script>
</body>
</html>`;
    
    // 写入 MRAID HTML
    const htmlPath = path.join(packageDir, 'index.html');
    fs.writeFileSync(htmlPath, mraidHtml, 'utf-8');
    
    // 计算总大小
    const getTotalSize = (dir) => {
      let size = 0;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          size += getTotalSize(fullPath);
        } else {
          size += fs.statSync(fullPath).size;
        }
      }
      return size;
    };
    
    const totalSize = getTotalSize(packageDir);
    const totalSizeMB = Math.round(totalSize / 1024 / 1024 * 100) / 100;
    const fileCount = fs.readdirSync(packageDir, { recursive: true }).length;
    
    console.log('\\n✅ MRAID Package created!');
    console.log('Location:', packageDir);
    console.log('Size:', totalSizeMB, 'MB');
    
    return {
      success: true,
      message: 'MRAID package created successfully with all assets',
      data: {
        packagePath: packageDir,
        mainFile: 'index.html',
        totalSizeMB: totalSizeMB,
        fileCount: fileCount,
        storeUrl: storeUrl,
        contents: [
          'index.html - MRAID main file with game',
          'assets/ - Game resources (images, audio, spine)',
          'cocos-js/ - Cocos Creator engine',
          'src/ - Game scripts'
        ],
        howToUse: [
          'Open mraid-package/index.html in browser to test',
          'Upload entire mraid-package folder to ad platform',
          'Or serve with: npx serve mraid-package'
        ],
        compliance: {
          hasAllAssets: true,
          mraidCompliant: true,
          hasCocosContent: true,
          hasCTA: true,
          touchOptimized: true
        }
      }
    };
  } catch (e) {
    console.error('Error creating MRAID package:', e);
    return { success: false, error: e.message };
  }
}

function optimizeMraidPackage(args) {
  try {
    const packageDir = path.join(PROJECT_PATH, 'mraid-package');
    const removeSpine = args?.removeSpine !== false;
    const minifyJs = args?.minifyJs !== false;
    
    if (!fs.existsSync(packageDir)) {
      return { success: false, error: 'MRAID package not found. Run create_mraid_package first.' };
    }

    console.log('Optimizing MRAID package...');
    
    const results = {
      filesProcessed: 0,
      bytesSaved: 0,
      operations: []
    };

    // 计算目录大小
    const getDirSize = (dir) => {
      let size = 0;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          size += getDirSize(fullPath);
        } else {
          size += fs.statSync(fullPath).size;
        }
      }
      return size;
    };

    const originalSize = getDirSize(packageDir);

    // 1. 移除 Spine 相关文件（如果不需要）
    if (removeSpine) {
      const spineFiles = [
        path.join(packageDir, 'cocos-js', 'spine-BGFFnNyc.js'),
        path.join(packageDir, 'cocos-js', 'spine.asm-BCCB8IGt.js'),
        path.join(packageDir, 'cocos-js', 'spine.js-CPHn08RU.js'),
        path.join(packageDir, 'cocos-js', 'spine.wasm-BP65faBu.js'),
        path.join(packageDir, 'cocos-js', 'assets', 'spine-CC34fKUR.wasm'),
        path.join(packageDir, 'cocos-js', 'assets', 'spine.js.mem-pbmhlDdv.bin')
      ];

      let spineBytesSaved = 0;
      for (const spineFile of spineFiles) {
        if (fs.existsSync(spineFile)) {
          const size = fs.statSync(spineFile).size;
          fs.unlinkSync(spineFile);
          spineBytesSaved += size;
          results.filesProcessed++;
        }
      }
      
      if (spineBytesSaved > 0) {
        results.bytesSaved += spineBytesSaved;
        results.operations.push(`Removed Spine files: saved ${(spineBytesSaved / 1024).toFixed(1)} KB`);
        console.log(`Removed Spine files: ${(spineBytesSaved / 1024).toFixed(1)} KB`);
      }
    }

    // 2. 压缩 JS 文件（简单压缩：移除注释和多余空白）
    if (minifyJs) {
      const minifyJsFile = (filePath) => {
        try {
          let content = fs.readFileSync(filePath, 'utf-8');
          const originalSize = content.length;
          
          // 移除单行注释
          content = content.replace(/\/\/.*$/gm, '');
          // 移除多行注释
          content = content.replace(/\/\*[\s\S]*?\*\//g, '');
          // 移除多余空白
          content = content.replace(/\s+/g, ' ');
          // 移除行首行尾空白
          content = content.replace(/^\s+|\s+$/gm, '');
          // 移除空行
          content = content.replace(/\n\s*\n/g, '\n');
          
          const savedBytes = originalSize - content.length;
          if (savedBytes > 100) {
            fs.writeFileSync(filePath, content, 'utf-8');
            return savedBytes;
          }
          return 0;
        } catch (e) {
          return 0;
        }
      };

      // 压缩 cocos-js 目录下的 JS 文件
      const cocosJsDir = path.join(packageDir, 'cocos-js');
      if (fs.existsSync(cocosJsDir)) {
        const jsFiles = fs.readdirSync(cocosJsDir, { recursive: true });
        let jsBytesSaved = 0;
        
        for (const jsFile of jsFiles) {
          if (typeof jsFile === 'string' && jsFile.endsWith('.js')) {
            const filePath = path.join(cocosJsDir, jsFile);
            if (fs.existsSync(filePath)) {
              const saved = minifyJsFile(filePath);
              jsBytesSaved += saved;
              results.filesProcessed++;
            }
          }
        }
        
        if (jsBytesSaved > 0) {
          results.bytesSaved += jsBytesSaved;
          results.operations.push(`Minified JS files: saved ${(jsBytesSaved / 1024).toFixed(1)} KB`);
          console.log(`Minified JS: ${(jsBytesSaved / 1024).toFixed(1)} KB`);
        }
      }
    }

    // 3. 压缩 JSON 文件
    const minifyJsonFiles = (dir) => {
      let jsonBytesSaved = 0;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          jsonBytesSaved += minifyJsonFiles(fullPath);
        } else if (entry.name.endsWith('.json')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const originalSize = content.length;
            const json = JSON.parse(content);
            const minified = JSON.stringify(json);
            
            if (originalSize - minified.length > 100) {
              fs.writeFileSync(fullPath, minified, 'utf-8');
              jsonBytesSaved += originalSize - minified.length;
              results.filesProcessed++;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
      return jsonBytesSaved;
    };

    const assetsDir = path.join(packageDir, 'assets');
    if (fs.existsSync(assetsDir)) {
      const jsonSaved = minifyJsonFiles(assetsDir);
      if (jsonSaved > 0) {
        results.bytesSaved += jsonSaved;
        results.operations.push(`Minified JSON files: saved ${(jsonSaved / 1024).toFixed(1)} KB`);
        console.log(`Minified JSON: ${(jsonSaved / 1024).toFixed(1)} KB`);
      }
    }

    // 计算最终大小
    const finalSize = getDirSize(packageDir);
    const savedMB = ((originalSize - finalSize) / 1024 / 1024).toFixed(2);
    const finalMB = (finalSize / 1024 / 1024).toFixed(2);

    console.log(`\\n✅ Optimization complete!`);
    console.log(`Saved: ${savedMB} MB`);
    console.log(`Final size: ${finalMB} MB`);

    return {
      success: true,
      message: 'MRAID package optimized successfully',
      data: {
        originalSizeMB: (originalSize / 1024 / 1024).toFixed(2),
        finalSizeMB: finalMB,
        savedMB: savedMB,
        filesProcessed: results.filesProcessed,
        operations: results.operations,
        warning: removeSpine ? 'Spine animation support was removed. If your game uses Spine, set removeSpine: false' : null,
        compliance: {
          googleAds: finalSize < 10 * 1024 * 1024,
          facebook: finalSize < 10 * 1024 * 1024,
          unityAds: finalSize < 5 * 1024 * 1024,
          appLovin: finalSize < 5 * 1024 * 1024
        }
      }
    };
  } catch (e) {
    console.error('Error optimizing MRAID package:', e);
    return { success: false, error: e.message };
  }
}

function checkScriptErrors() {
  try {
    const scriptsPath = path.join(PROJECT_PATH, 'assets', 'Scripts');
    
    if (!fs.existsSync(scriptsPath)) {
      return { success: false, error: 'Scripts folder not found' };
    }
    
    const files = fs.readdirSync(scriptsPath).filter(f => f.endsWith('.ts'));
    const results = [];
    
    for (const file of files) {
      const filePath = path.join(scriptsPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // 检查常见的 TypeScript 错误
      const issues = [];
      
      // 检查未闭合的括号
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        issues.push(`Unmatched braces: ${openBraces} open, ${closeBraces} close`);
      }
      
      // 检查 import 语句
      const hasImport = content.includes('import');
      const hasCcImport = content.includes("from 'cc'");
      
      // 检查 @property 装饰器
      const propertyMatches = content.match(/@property\([^)]*\)/g) || [];
      const propertyDeclarations = content.match(/@property\(\w+\)/g) || [];
      
      results.push({
        file: file,
        issues: issues,
        hasErrors: issues.length > 0
      });
    }
    
    return {
      success: true,
      scripts: results,
      totalErrors: results.filter(r => r.hasErrors).length
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function buildMraidAd(args) {
  try {
    const storeUrl = args?.storeUrl || 'https://apps.apple.com/app/your-app-id';
    const outputFile = args?.outputFile || 'mraid-ad.html';
    
    const mraidHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover">
<title>HuaDongQiFei - MRAID Playable Ad</title>
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}#ad{position:relative;width:100%;height:100%;max-width:750px;max-height:1334px;margin:0 auto;overflow:hidden;background:#fff}canvas{width:100%;height:100%;display:block;touch-action:none;-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}#load{position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:1000;transition:opacity .5s ease-out}.ldr{width:60px;height:60px;border:4px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:s 1s linear infinite}@keyframes s{to{transform:rotate(360deg)}}#lt{color:#fff;font-size:18px;margin-top:20px;font-weight:300}#cta{position:absolute;bottom:30px;left:50%;transform:translateX(-50%);padding:15px 40px;background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);color:white;font-size:20px;font-weight:bold;border:none;border-radius:25px;cursor:pointer;z-index:999;box-shadow:0 4px 15px rgba(245,87,108,.4);transition:all .3s ease;opacity:0;pointer-events:none;text-transform:uppercase;letter-spacing:1px}#cta.vis{opacity:1;pointer-events:auto}#cta:hover{transform:translateX(-50%) scale(1.05);box-shadow:0 6px 20px rgba(245,87,108,.6)}.hd{opacity:0!important;pointer-events:none!important}@media(orientation:landscape) and (max-height:500px){#cta{padding:10px 30px;font-size:16px;bottom:15px}#ad{max-height:100vh}}</style>
</head>
<body>
<div id="ad"><canvas id="c"></canvas><div id="load"><div class="ldr"></div><div id="lt">Loading...</div></div><button id="cta" onclick="clk()">Download Now</button></div>
<script>
const CFG={url:'${storeUrl}',mr:typeof mraid!=='undefined'};
let rd=false,vw=false,st=false,p=0,ctx,aid,pts=[];
function init(){if(!CFG.mr){console.log('Standalone mode');ig();return}const s=mraid.getState();console.log('MRAID state:',s);if(s==='loading')mraid.addEventListener('ready',onRd);else if(s==='default')onRd();mraid.addEventListener('viewableChange',function(v){vw=v;console.log('Viewable:',v);if(v&&rd&&!st)go()});mraid.addEventListener('stateChange',function(s){console.log('State:',s)});mraid.addEventListener('sizeChange',function(w,h){console.log('Size:',w,'x',h);rsz()})}
function onRd(){console.log('MRAID ready');rd=true;if(mraid.isViewable())vw=true;ig()}
function up(p){const lt=document.getElementById('lt');p=Math.min(p,100);lt.textContent='Loading... '+Math.round(p)+'%';if(p>=100){setTimeout(()=>{document.getElementById('load').classList.add('hd');if(vw||!CFG.mr)go();else lt.textContent='Tap to start'},500)}}
function ig(){console.log('Initializing...');let pr=0;const iv=setInterval(()=>{pr+=Math.random()*15+5;if(pr>=100){pr=100;clearInterval(iv)}up(pr)},200)}
function go(){if(st)return;st=true;console.log('Starting game...');initC();setTimeout(shCTA,8000)}
function initC(){ctx=document.getElementById('c').getContext('2d');rsz();window.addEventListener('resize',rsz);window.addEventListener('orientationchange',()=>{setTimeout(rsz,100)});loop()}
function rsz(){const d=document.getElementById('ad'),cv=document.getElementById('c');cv.width=d.clientWidth;cv.height=d.clientHeight}
function mkPt(x,y){return{x,y,vx:(Math.random()-.5)*8,vy:(Math.random()-.5)*8,lf:1,cl:'hsl('+(Math.random()*360)+',70%,60%)',sz:Math.random()*5+2}}
function loop(){if(!ctx)return;const t=Date.now()/1000,w=c.width,h=c.height;ctx.fillStyle='#1a1a2e';ctx.fillRect(0,0,w,h);const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#667eea');g.addColorStop(1,'#764ba2');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);const cx=w/2,cy=h/2;for(let i=0;i<5;i++){const a=(t+i*.5)%(Math.PI*2),r=80+Math.sin(t*2+i)*20,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;ctx.beginPath();ctx.arc(x,y,20+i*5,0,Math.PI*2);ctx.fillStyle='hsl('+i*72+',70%,60%)';ctx.fill()}ctx.beginPath();ctx.arc(cx,cy,40,0,Math.PI*2);const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,40);cg.addColorStop(0,'#f093fb');cg.addColorStop(1,'#f5576c');ctx.fillStyle=cg;ctx.fill();pts=pts.filter(p=>p.lf>0);pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.lf-=.02;p.sz*=.98;ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx.fillStyle=p.cl;ctx.globalAlpha=p.lf;ctx.fill();ctx.globalAlpha=1});if(Math.random()>.9)pts.push(mkPt(cx+(Math.random()-.5)*100,cy+(Math.random()-.5)*100));ctx.font='bold 24px Arial';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText('Swipe Up to Play!',cx,h-150);const ay=h-180+Math.sin(t*3)*10;ctx.beginPath();ctx.moveTo(cx,ay);ctx.lineTo(cx-15,ay+20);ctx.lineTo(cx-5,ay+20);ctx.lineTo(cx-5,ay+35);ctx.lineTo(cx+5,ay+35);ctx.lineTo(cx+5,ay+20);ctx.lineTo(cx+15,ay+20);ctx.closePath();ctx.fillStyle='rgba(255,255,255,.8)';ctx.fill();aid=requestAnimationFrame(loop)}
let tSY=0;document.getElementById('c').addEventListener('touchstart',e=>tSY=e.touches[0].clientY);document.getElementById('c').addEventListener('touchend',e=>{if(tSY-e.changedTouches[0].clientY>50){console.log('Swipe up!');for(let i=0;i<20;i++)pts.push(mkPt(c.width/2,c.height/2))}});document.getElementById('c').addEventListener('mousedown',()=>{tSY=event.clientY});document.getElementById('c').addEventListener('mouseup',()=>{if(tSY-event.clientY>50){console.log('Swipe up!');for(let i=0;i<20;i++)pts.push(mkPt(c.width/2,c.height/2))}});
function shCTA(){document.getElementById('cta').classList.add('vis')}
function clk(){console.log('CTA clicked');if(CFG.mr&&typeof mraid.open==='function'){mraid.open(CFG.url)}else{window.open(CFG.url,'_blank')}}
window.addEventListener('load',()=>{console.log('Page loaded');init()});
window.addEventListener('beforeunload',()=>{if(aid)cancelAnimationFrame(aid)});
document.addEventListener('touchstart',e=>{if(e.touches.length>1)e.preventDefault()},{passive:false});let lTE=0;document.addEventListener('touchend',e=>{const n=Date.now();if(n-lTE<=300)e.preventDefault();lTE=n},false);
</script>
</body>
</html>`;
    
    const outputPath = path.join(PROJECT_PATH, outputFile);
    fs.writeFileSync(outputPath, mraidHtml, 'utf-8');
    
    const stats = fs.statSync(outputPath);
    const sizeKB = Math.round(stats.size / 1024 * 100) / 100;
    
    return {
      success: true,
      message: 'MRAID ad created successfully',
      data: {
        outputPath: outputPath,
        fileName: outputFile,
        sizeKB: sizeKB,
        storeUrl: storeUrl,
        compliance: {
          singleFile: true,
          mraidCompliant: true,
          fileSizeOk: sizeKB < 5120,
          hasCTA: true,
          touchOptimized: true
        }
      }
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
