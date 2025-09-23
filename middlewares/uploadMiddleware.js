const multer = require('multer');
const path = require('path');
const fs = require('fs');

const AVATARS_DIR = path.join(process.cwd(), 'uploads', 'avatars');
fs.mkdirSync(AVATARS_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, AVATARS_DIR),
    filename: (req, file, cb) => {
        const ext = (file.mimetype && file.mimetype.split('/')[1]) || 'bin';
        cb(null, `${req.user.id}_${Date.now()}.${ext}`);
    }
});

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
function fileFilter(_req, file, cb) {
    if (!allowed.has(file.mimetype)) return cb(new Error('Unsupported file type'), false);
    cb(null, true);
}

const avatarUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = { avatarUpload, AVATARS_DIR };
