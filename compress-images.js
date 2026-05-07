const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'mraid-package', 'assets', 'main', 'native');

async function compressImages() {
  console.log('========================================');
  console.log('🖼️  开始压缩图片...');
  console.log('========================================\n');
  
  let totalOriginal = 0;
  let totalCompressed = 0;
  let fileCount = 0;
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (/\.(png|jpg|jpeg)$/i.test(file)) {
        compressImage(filePath);
      }
    }
  }
  
  async function compressImage(filePath) {
    try {
      const originalSize = fs.statSync(filePath).size;
      const ext = path.extname(filePath).toLowerCase();
      
      if (ext === '.png') {
        await sharp(filePath)
          .png({ quality: 80, compressionLevel: 9, palette: false })
          .toFile(filePath + '.tmp');
      } else if (ext === '.jpg' || ext === '.jpeg') {
        await sharp(filePath)
          .jpeg({ quality: 80, mozjpeg: true })
          .toFile(filePath + '.tmp');
      }
      
      const compressedSize = fs.statSync(filePath + '.tmp').size;
      
      if (compressedSize < originalSize) {
        fs.unlinkSync(filePath);
        fs.renameSync(filePath + '.tmp', filePath);
        
        const savedKB = ((originalSize - compressedSize) / 1024).toFixed(1);
        const percent = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1);
        const fileName = path.basename(filePath);
        
        console.log(`✅ ${fileName}: ${(originalSize/1024).toFixed(1)}KB → ${(compressedSize/1024).toFixed(1)}KB (-${percent}%, -${savedKB}KB)`);
        
        totalOriginal += originalSize;
        totalCompressed += compressedSize;
        fileCount++;
      } else {
        fs.unlinkSync(filePath + '.tmp');
        console.log(`⏭️  ${path.basename(filePath)}: 已是最佳大小`);
      }
    } catch (err) {
      console.error(`❌ ${path.basename(filePath)}: ${err.message}`);
      if (fs.existsSync(filePath + '.tmp')) {
        fs.unlinkSync(filePath + '.tmp');
      }
    }
  }
  
  if (!fs.existsSync(assetsDir)) {
    console.error('❌ 目录不存在:', assetsDir);
    return;
  }
  
  walkDir(assetsDir);
  
  console.log('\n========================================');
  console.log('📊 压缩完成！');
  console.log('========================================');
  console.log(`处理文件: ${fileCount} 张`);
  console.log(`原始大小: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`压缩后: ${(totalCompressed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`节省: ${((totalOriginal - totalCompressed) / 1024 / 1024).toFixed(2)} MB (${(((totalOriginal - totalCompressed) / totalOriginal) * 100).toFixed(1)}%)`);
}

compressImages().catch(console.error);
