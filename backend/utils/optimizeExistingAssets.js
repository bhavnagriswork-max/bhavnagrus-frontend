const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { optimizeExistingFile } = require('./imageOptimizer');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const STATIC_IMAGES_DIR = path.join(__dirname, '..', '..', 'frontend', 'src', 'assets', 'images');

async function run() {
  console.log('=== STARTING IMAGE OPTIMIZATION SCRIPT ===\n');

  // 1. Optimize existing uploads
  if (fs.existsSync(UPLOADS_DIR)) {
    console.log(`Scanning uploads directory: ${UPLOADS_DIR}`);
    const files = fs.readdirSync(UPLOADS_DIR);
    let optimizedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(UPLOADS_DIR, file);
      if (fs.statSync(filePath).isFile()) {
        const res = await optimizeExistingFile(filePath);
        if (res) optimizedCount++;
      }
    }
    console.log(`\nFinished uploads optimization. Optimized ${optimizedCount} files.\n`);
  } else {
    console.log(`Uploads directory not found at: ${UPLOADS_DIR}`);
  }

  // 2. Convert and compress frontend static assets to WebP
  if (fs.existsSync(STATIC_IMAGES_DIR)) {
    console.log(`Scanning static images directory: ${STATIC_IMAGES_DIR}`);
    const files = fs.readdirSync(STATIC_IMAGES_DIR);
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (ext === '.png') {
        const pngPath = path.join(STATIC_IMAGES_DIR, file);
        const webpName = path.basename(file, ext) + '.webp';
        const webpPath = path.join(STATIC_IMAGES_DIR, webpName);
        
        console.log(`Converting ${file} to WebP...`);
        try {
          const stats = fs.statSync(pngPath);
          const sizeKBBefore = stats.size / 1024;
          
          await sharp(pngPath)
            .resize({ width: 1200, withoutEnlargement: true }) // Resize to max 1200px width
            .webp({ quality: 80 })
            .toFile(webpPath);
            
          const sizeKBAfter = fs.statSync(webpPath).size / 1024;
          console.log(`Converted static asset: ${file} (${sizeKBBefore.toFixed(1)}KB) -> ${webpName} (${sizeKBAfter.toFixed(1)}KB)`);
          
          // Delete the original PNG file to ensure it's not loaded by accident
          fs.unlinkSync(pngPath);
          console.log(`Deleted original PNG: ${file}`);
        } catch (err) {
          console.error(`Failed to convert ${file}:`, err.message);
        }
      }
    }
    console.log(`\nFinished static images conversion.\n`);
  } else {
    console.log(`Static images directory not found at: ${STATIC_IMAGES_DIR}`);
  }

  console.log('=== IMAGE OPTIMIZATION SCRIPT COMPLETED ===');
}

run().catch(err => {
  console.error('Fatal error running optimization script:', err);
});
