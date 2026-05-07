const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'mraid-package', 'assets', 'main', 'native');

const targetFiles = [
  '21cfe23f-ff61-4d85-aaff-40ddabf89565.png',
  '7cf0835c-e456-4dcf-8bb8-122b30625c8d.png',
  'b07011fc-b5ee-4368-b041-1d2288496575.png'
];

async function findFile(filename) {
  const results = [];
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file === filename) {
        results.push(filePath);
      }
    }
  }
  
  walkDir(assetsDir);
  return results[0];
}

async function strongCompress() {
  console.log('========================================');
  console.log('🔥 强力压缩模式 (quality: 60)');
  console.log('========================================\n');
  
  let totalOriginal = 0;
  let totalCompressed = 0;
  
  for (const filename of targetFiles) {
    const filePath = await findFile(filename);
    
    if (!filePath) {
      console.log(`❌ 未找到: ${filename}`);
      continue;
    }
    
    try {
      const originalSize = fs.statSync(filePath).size;
      
      await sharp(filePath)
        .png({ 
          compressionLevel: 9,
          palette: true,
          quality: 60,
          effort: 10,
          adaptiveFiltering: true
        })
        .toFile(filePath + '.tmp');
      
      let compressedSize = fs.statSync(filePath + '.tmp').size;
      
      if (compressedSize >= originalSize) {
        fs.unlinkSync(filePath + '.tmp');
        
        await sharp(filePath)
          .png({ compressionLevel: 9, quality: 50 })
          .toFile(filePath + '.tmp');
        
        compressedSize = fs.statSync(filePath + '.tmp').size;
      }
      
      if (compressedSize < originalSize) {
        fs.unlinkSync(filePath);
        fs.renameSync(filePath + '.tmp', filePath);
        
        const savedKB = ((originalSize - compressedSize) / 1024).toFixed(1);
        const percent = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1);
        
        console.log(`✅ ${filename}`);
        console.log(`   ${(originalSize/1024).toFixed(1)}KB → ${(compressedSize/1024).toFixed(1)}KB`);
        console.log(`   节省: ${percent}%, ${savedKB}KB\n`);
        
        totalOriginal += originalSize;
        totalCompressed += compressedSize;
      } else {
        fs.unlinkSync(filePath + '.tmp');
        console.log(`⏭️  ${filename}: 已是最优\n`);
      }
    } catch (err) {
      console.error(`❌ ${filename}: ${err.message}\n`);
      if (fs.existsSync(filePath + '.tmp')) {
        fs.unlinkSync(filePath + '.tmp');
      }
    }
  }
  
  console.log('========================================');
  console.log('📊 压缩结果:');
  console.log('========================================');
  console.log(`原始大小: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`压缩后:   ${(totalCompressed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`节省:     ${((totalOriginal - totalCompressed) / 1024 / 1024).toFixed(2)} MB (${(((totalOriginal - totalCompressed) / totalOriginal) * 100).toFixed(1)}%)`);
}

strongCompress().catch(console.error);
