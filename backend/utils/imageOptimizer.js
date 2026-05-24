const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Optimizes an image buffer:
 * - Resizes if wider than 1200px (maintaining aspect ratio)
 * - Converts to optimized WebP format (quality: 80)
 * - Returns the optimized buffer
 */
const optimizeImageBuffer = async (buffer) => {
  try {
    let pipeline = sharp(buffer);
    const metadata = await pipeline.metadata();

    // Resize if width is larger than 1200px
    if (metadata.width && metadata.width > 1200) {
      pipeline = pipeline.resize({ width: 1200, withoutEnlargement: true });
    }

    // Convert to webp with quality 80
    return await pipeline.webp({ quality: 80 }).toBuffer();
  } catch (error) {
    console.error('Error optimizing image buffer:', error);
    throw error;
  }
};

/**
 * Optimizes an existing file on disk:
 * - Reads the file
 * - Resizes if wider than 1200px
 * - Saves back with highly optimized compression (preserving original format to prevent breaking DB paths, or converting depending on flag)
 */
const optimizeExistingFile = async (filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    // Skip if not a supported format
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      return false;
    }

    const buffer = fs.readFileSync(filePath);
    let pipeline = sharp(buffer);
    const metadata = await pipeline.metadata();

    // Check if it really needs optimization (e.g. size > 150KB or dimensions > 1200px)
    const stats = fs.statSync(filePath);
    const sizeKB = stats.size / 1024;

    if (sizeKB < 150 && (!metadata.width || metadata.width <= 1200)) {
      // Already optimized enough
      return false;
    }

    // Resize if wider than 1200px
    if (metadata.width && metadata.width > 1200) {
      pipeline = pipeline.resize({ width: 1200, withoutEnlargement: true });
    }

    // Compress based on format (preserve original format to avoid database mismatch)
    if (ext === '.png') {
      pipeline = pipeline.png({ quality: 80, compressionLevel: 8 });
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({ quality: 80 });
    } else {
      pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
    }

    const optimizedBuffer = await pipeline.toBuffer();
    
    // Backup original just in case, then overwrite
    const tempPath = filePath + '.tmp';
    fs.writeFileSync(tempPath, optimizedBuffer);
    fs.renameSync(tempPath, filePath);

    console.log(`Optimized: ${path.basename(filePath)} (from ${sizeKB.toFixed(1)}KB to ${(optimizedBuffer.length/1024).toFixed(1)}KB)`);
    return true;
  } catch (error) {
    console.error(`Failed to optimize file ${filePath}:`, error.message);
    return false;
  }
};

module.exports = {
  optimizeImageBuffer,
  optimizeExistingFile
};
