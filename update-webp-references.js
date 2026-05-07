const fs = require('fs');
const path = require('path');

const packageDir = path.join(__dirname, 'mraid-package');

function updateJsonFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      updateJsonFiles(fullPath);
    } else if (entry.name.endsWith('.json')) {
      try {
        let content = fs.readFileSync(fullPath, 'utf-8');
        
        const originalContent = content;
        content = content.replace(/\.png/g, '.webp');
        
        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content, 'utf-8');
          console.log(`✅ 更新: ${fullPath.replace(packageDir, '')}`);
        }
      } catch (e) {}
    }
  }
}

console.log('========================================');
console.log('🔄 更新 JSON 配置 (.png → .webp)');
console.log('========================================\n');

updateJsonFiles(packageDir);

console.log('\n✅ 配置更新完成！');
