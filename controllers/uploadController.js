const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp'); // For image compression
const crypto = require('crypto'); // For generating cache keys
require('dotenv').config();

// Simple in-memory cache for uploaded images
const uploadCache = new Map();
const CACHE_SIZE_LIMIT = 100; // Maximum number of cached items

// Multer setup with file size limits
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});
exports.uploadMiddleware = upload.single('image');

// Generate cache key from image buffer
function generateCacheKey(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

// Manage cache size
function manageCache() {
  if (uploadCache.size > CACHE_SIZE_LIMIT) {
    const firstKey = uploadCache.keys().next().value;
    uploadCache.delete(firstKey);
  }
}

// Enhanced image compression using Sharp
async function compressImage(buffer, quality = 70) {
  try {
    const compressed = await sharp(buffer)
      .jpeg({ 
        quality,
        progressive: true, // Progressive JPEG for faster loading
        mozjpeg: true // Better compression
      })
      .resize(800, 600, { 
        fit: 'inside', 
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3 // Better quality resizing
      })
      .toBuffer();
    return compressed;
  } catch (error) {
    console.error('Image compression failed:', error);
    return buffer; // Return original if compression fails
  }
}

// Optimized ImgBB upload with retry mechanism
async function uploadToImgbb(buffer, filename, retries = 2) {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error('IMGBB API key not set');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`ImgBB upload attempt ${attempt}/${retries}`);
      
      const form = new FormData();
      form.append('image', buffer.toString('base64'));
      form.append('name', filename);

      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${apiKey}`,
        form,
        { 
          headers: form.getHeaders(),
          timeout: 25000, // 25 second timeout
          maxContentLength: 10 * 1024 * 1024, // 10MB max response
          // Add connection pooling for better performance
          httpAgent: new (require('http').Agent)({ 
            keepAlive: true,
            maxSockets: 5,
            timeout: 30000
          }),
          httpsAgent: new (require('https').Agent)({ 
            keepAlive: true,
            maxSockets: 5,
            timeout: 30000
          })
        }
      );

      return response.data.data.url;
    } catch (error) {
      console.error(`ImgBB upload attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

exports.uploadToImgbb = async (req, res) => {
  try {
    console.log('Request received at /upload');

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received:', req.file.originalname, 'Size:', req.file.size);

    // Check cache first
    const cacheKey = generateCacheKey(req.file.buffer);
    if (uploadCache.has(cacheKey)) {
      console.log('Image found in cache, returning cached URL');
      return res.json({ url: uploadCache.get(cacheKey) });
    }

    // Enhanced compression with multiple quality levels
    console.log('Compressing image...');
    let compressedBuffer = await compressImage(req.file.buffer, 70);
    
    // If still too large, compress more aggressively
    if (compressedBuffer.length > 2 * 1024 * 1024) { // If > 2MB
      console.log('Image still large, compressing more aggressively...');
      compressedBuffer = await compressImage(req.file.buffer, 50);
    }
    
    console.log('Original size:', req.file.size, 'Compressed size:', compressedBuffer.length);

    // Upload to ImgBB with retry mechanism
    console.log('Uploading to ImgBB...');
    const imageUrl = await uploadToImgbb(compressedBuffer, req.file.originalname);
    console.log('ImgBB upload successful:', imageUrl);

    // Cache the result
    manageCache();
    uploadCache.set(cacheKey, imageUrl);

    res.json({ url: imageUrl });

  } catch (err) {
    console.error('Error uploading image:', err.message);
    
    if (err.code === 'ECONNABORTED') {
      return res.status(408).json({ error: 'Upload timeout. Please try again.' });
    }
    
    if (err.response) {
      console.error('ImgBB response error:', err.response.data);
      return res.status(err.response.status).json({ error: err.response.data });
    }
    
    if (err.message === 'Only image files are allowed') {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }
    
    if (err.message === 'IMGBB API key not set') {
      return res.status(500).json({ error: 'Upload service not configured properly.' });
    }
    
    res.status(500).json({ error: 'Upload failed. Please try again.' });
  }
};
