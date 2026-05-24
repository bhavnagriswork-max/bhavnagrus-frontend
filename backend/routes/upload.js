const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');
const { optimizeImageBuffer } = require('../utils/imageOptimizer');

// Use memory storage to store raw buffers for optimization
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed!'));
    }
});

// Single image upload with automatic optimization to WebP
router.post('/', protect, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const originalName = path.basename(req.file.originalname, path.extname(req.file.originalname));
        const filename = `${Date.now()}-${originalName.replace(/\s+/g, '_')}.webp`;
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        
        // Ensure uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const optimizedBuffer = await optimizeImageBuffer(req.file.buffer);
        fs.writeFileSync(path.join(uploadsDir, filename), optimizedBuffer);

        const imageUrl = `/uploads/${filename}`;
        res.json({ imageUrl });
    } catch (err) {
        console.error('Image upload optimization error:', err);
        res.status(500).json({ message: 'Failed to upload and optimize image', error: err.message });
    }
});

// Multiple images upload with automatic optimization to WebP
router.post('/multiple', protect, upload.array('images', 5), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }

    try {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        // Ensure uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const imageUrls = [];
        for (const file of req.files) {
            const originalName = path.basename(file.originalname, path.extname(file.originalname));
            const filename = `${Date.now()}-${originalName.replace(/\s+/g, '_')}.webp`;
            
            const optimizedBuffer = await optimizeImageBuffer(file.buffer);
            fs.writeFileSync(path.join(uploadsDir, filename), optimizedBuffer);
            
            imageUrls.push(`/uploads/${filename}`);
        }

        res.json({ imageUrls });
    } catch (err) {
        console.error('Multiple images upload optimization error:', err);
        res.status(500).json({ message: 'Failed to upload and optimize images', error: err.message });
    }
});

module.exports = router;
