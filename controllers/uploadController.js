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

// Upload controller with proper error handling
exports.uploadToImgbb = async (req, res) => {
  try {
    console.log('Request received at /upload');

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded. Please select an image to upload.'
      });
    }

    console.log('File received:', req.file.originalname, 'Size:', req.file.size);

    // Check file type
    if (!req.file.mimetype.startsWith('image/')) {
      console.error('Invalid file type:', req.file.mimetype);
      return res.status(400).json({ 
        success: false,
        error: 'Only image files are allowed (JPEG, PNG, etc.)'
      });
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      console.error('File too large:', req.file.size);
      return res.status(400).json({ 
        success: false,
        error: 'Image size must be less than 5MB'
      });
    }

    // Check cache first
    const cacheKey = generateCacheKey(req.file.buffer);
    
    if (uploadCache.has(cacheKey)) {
      console.log('Serving from cache');
      return res.json({ 
        success: true,
        url: uploadCache.get(cacheKey) 
      });
    }

    // Compress image before upload
    let compressedImage;
    try {
      compressedImage = await compressImage(req.file.buffer);
      console.log('Image compressed successfully');
    } catch (compressError) {
      console.error('Image compression failed, using original:', compressError);
      compressedImage = req.file.buffer; // Fallback to original
    }
    
    try {
      // Upload to ImgBB
      console.log('Uploading to ImgBB...');
      const imgbbResponse = await uploadToImgbb(
        compressedImage,
        req.file.originalname || `image-${Date.now()}.jpg`
      );

      if (!imgbbResponse?.data?.data?.url) {
        console.error('Invalid ImgBB response:', JSON.stringify(imgbbResponse?.data));
        throw new Error('Failed to get image URL from the image hosting service');
      }

      const imageUrl = imgbbResponse.data.data.url;
      console.log('Image uploaded successfully:', imageUrl);
      
      // Cache the result
      manageCache();
      uploadCache.set(cacheKey, imageUrl);

      return res.json({ 
        success: true,
        url: imageUrl 
      });
    } catch (uploadError) {
      console.error('Upload to ImgBB failed:', uploadError);
      
      if (uploadError.message.includes('API key')) {
        return res.status(500).json({ 
          success: false,
          error: 'Upload service not configured properly. Please contact support.'
        });
      }
      
      throw uploadError; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error('Upload error:', error);
    
    let errorMessage = 'Failed to upload image';
    
    // Provide more specific error messages based on error type
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Upload timed out. Please try again.';
    } else if (error.response) {
      // Handle HTTP error responses
      errorMessage = `Upload service error: ${error.response.status} - ${error.response.statusText}`;
    }
    
    res.status(500).json({ 
      success: false,
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        stack: error.stack
      })
    });
  }
};
