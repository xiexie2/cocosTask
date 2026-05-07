const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'mraid-package', 'assets', 'main', 'native');

async function convertToWebP() {
  console.log('========================================');
  console.log('🔄 PNG → WebP 转换开始...');
  console.log('========================================\n');
  
  let totalOriginal = 0;
  let totalWebP = 0;
  let fileCount = 0;
  
  const convertedFiles = [];
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (/\.png$/i.test(file)) {
        convertFile(filePath);
      }
    }
  }
  
  async function convertFile(filePath) {
    try {
      const originalSize = fs.statSync(filePath).size;
      const webpPath = filePath.replace(/\.png$/i, '.webp');
      
      await sharp(filePath)
        .webp({ 
          quality: 85,
          effort: 6,
          lossless: false,
          nearLossless: true,
          smartSubsample: true
        })
        .toFile(webpPath);
      
      const webpSize = fs.statSync(webpPath).size;
      const savedPercent = (((originalSize - webpSize) / originalSize) * 100).toFixed(1);
      const savedKB = ((originalSize - webpSize) / 1024).toFixed(1);
      const fileName = path.basename(filePath);
      
      if (webpSize < originalSize) {
        fs.unlinkSync(filePath);
        
        convertedFiles.push({
          name: fileName,
          original: originalSize,
          webp: webpSize,
          saved: savedPercent
        });
        
        if (originalSize > 50000 || savedPercent > 30) {
          console.log(`✅ ${fileName}`);
          console.log(`   ${(originalSize/1024).toFixed(1)}KB → ${(webpSize/1024).toFixed(1)}KB (-${savedPercent}%, -${savedKB}KB)\n`);
        }
        
        totalOriginal += originalSize;
        totalWebP += webpSize;
        fileCount++;
      } else {
        fs.unlinkSync(webpPath);
        console.log(`⏭️  ${fileName}: WebP 更大，保持 PNG`);
      }
    } catch (err) {
      console.error(`❌ ${path.basename(filePath)}: ${err.message}`);
    }
  }
  
  if (!fs.existsSync(assetsDir)) {
    console.error('❌ 目录不存在:', assetsDir);
    return;
  }
  
  walkDir(assetsDir);
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('\n========================================');
  console.log('📊 转换完成！');
  console.log('========================================');
  console.log(`转换文件: ${fileCount} 张`);
  console.log(`原始大小: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`WebP 大小: ${(totalWebP / 1024 / 1024).toFixed(2)} MB`);
  console.log(`节省:     ${((totalOriginal - totalWebP) / 1024 / 1024).toFixed(2)} MB (${(((totalOriginal - totalWebP) / totalOriginal) * 100).toFixed(1)}%)`);
  
  return convertedFiles;
}

convertToWebP().catch(console.error);
