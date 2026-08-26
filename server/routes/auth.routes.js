const express = require('express');
const router = express.Router();
const { register, verifyOTP, login, getMe, saveFaceEmbedding } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', upload.single('photo'), register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/save-face', protect, saveFaceEmbedding);

module.exports = router;
