/**
 * AWS S3 Configuration
 * Used for: product images, restaurant logos, user avatars, KYC documents, banners
 * Falls back to local /uploads/ when S3 not configured
 */

const path = require('path');
const fs = require('fs');
const multer = require('multer');

// ─── S3 CLIENT (lazy init) ─────
let s3Client = null;

const getS3Client = () => {
  if (s3Client) return s3Client;
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) return null;
  try {
    const { S3Client } = require('@aws-sdk/client-s3');
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY },
    });
    return s3Client;
  } catch {
    return null;
  }
};

// ─── UPLOAD TO S3 ────
const uploadToS3 = async (file, folder = 'general') => {
  const client = getS3Client();
  if (!client || !process.env.AWS_S3_BUCKET) {
    return uploadLocally(file, folder);
  }
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  const key = `${folder}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
  await client.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  }));
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
};

// ─── DELETE FROM S3 ────
const deleteFromS3 = async (url) => {
  const client = getS3Client();
  if (!client || !url.includes('amazonaws.com')) return;
  try {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const key = url.split('.amazonaws.com/')[1];
    await client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key }));
  } catch (err) {
    console.error('S3 delete error:', err.message);
  }
};

// ─── LOCAL FALLBACK ────
const uploadLocally = (file, folder) => {
  const uploadDir = path.join(process.cwd(), 'uploads', folder);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
  fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
  return `/uploads/${folder}/${filename}`;
};

// ─── MULTER MEMORY STORAGE ────
const multerMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only images and PDFs are allowed.'), false);
  },
});

// ─── UPLOAD MIDDLEWARE FACTORY ─────
const uploadSingle = (fieldName, folder = 'general') => [
  multerMemory.single(fieldName),
  async (req, res, next) => {
    if (!req.file) return next();
    try {
      req.uploadedUrl = await uploadToS3(req.file, folder);
      req.body[fieldName] = req.uploadedUrl;
      next();
    } catch (err) { next(err); }
  },
];

const uploadMultiple = (fieldName, maxCount = 5, folder = 'general') => [
  multerMemory.array(fieldName, maxCount),
  async (req, res, next) => {
    if (!req.files?.length) return next();
    try {
      const urls = await Promise.all(req.files.map(f => uploadToS3(f, folder)));
      req.uploadedUrls = urls;
      req.body[fieldName] = urls;
      next();
    } catch (err) { next(err); }
  },
];

module.exports = { uploadToS3, deleteFromS3, uploadSingle, uploadMultiple, getS3Client };