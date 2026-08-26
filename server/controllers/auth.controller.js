const User = require('../models/User');
const Voter = require('../models/Voter');
const { generateToken } = require('../middleware/auth');
const { encrypt } = require('../config/encryption');
const nodemailer = require('nodemailer');
const path = require('path');

// Email transporter — created lazily to avoid crash if email not configured
const getTransporter = () => {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
    return null; // Email not configured — skip sending
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * @desc    Register new voter
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, mobile, password, voterId, dob, street, city, state, pincode, faceEmbedding } = req.body;

    // Basic validation
    if (!name || !email || !mobile || !password || !voterId || !dob) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, mobile, password, voterId, dob.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Check if voter ID already exists
    const existingVoter = await Voter.findOne({ voterId: voterId.toUpperCase() });
    if (existingVoter) {
      return res.status(400).json({ success: false, message: 'Voter ID already registered.' });
    }

    // Create user
    const user = await User.create({ name, email: email.toLowerCase(), mobile, password, role: 'voter' });

    // Get photo path
    const photoPath = req.file ? `/uploads/photos/${req.file.filename}` : null;

    // Encrypt face embedding if provided
    let encryptedFaceEmbedding = null;
    if (faceEmbedding) {
      try {
        // faceEmbedding arrives as a JSON string from FormData
        const parsed = typeof faceEmbedding === 'string' ? JSON.parse(faceEmbedding) : faceEmbedding;
        encryptedFaceEmbedding = encrypt(parsed);
      } catch (encErr) {
        console.warn('Could not encrypt face embedding:', encErr.message);
      }
    }

    // Create voter profile
    const voter = await Voter.create({
      voterId: voterId.toUpperCase(),
      userId: user._id,
      name,
      dob: new Date(dob),
      address: { street, city, state, pincode },
      photo: photoPath,
      faceEmbedding: encryptedFaceEmbedding
    });

    // Generate OTP for email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };
    await user.save({ validateBeforeSave: false });

    // Send OTP email (only if email is configured)
    const transporter = getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Hybrid Voting System" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Email Verification OTP',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4f46e5;">Email Verification</h2>
              <p>Your OTP for email verification is:</p>
              <h1 style="color: #4f46e5; letter-spacing: 8px;">${otp}</h1>
              <p>This OTP expires in 10 minutes.</p>
            </div>
          `
        });
      } catch (emailErr) {
        console.error('Email send failed (non-critical):', emailErr.message);
      }
    } else {
      // Email not configured — log OTP to console for development
      console.log(`📧 [DEV MODE] OTP for ${email}: ${otp}`);
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please verify your email with the OTP sent.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      voter
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).select('+otp');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (!user.otp?.code || user.otp.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    if (new Date() > user.otp.expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Login
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { voterId, password, email, role } = req.body;

    let user;

    if (role === 'voter' && voterId) {
      // Voter logs in with voter ID
      const voter = await Voter.findOne({ voterId: voterId.toUpperCase() });
      if (!voter) {
        return res.status(401).json({ success: false, message: 'Invalid Voter ID or password.' });
      }
      user = await User.findById(voter.userId).select('+password');
    } else {
      // Admin/Officer logs in with email
      user = await User.findOne({ email }).select('+password');
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your Voter ID.' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    // Get voter profile if voter
    let voterProfile = null;
    if (user.role === 'voter') {
      voterProfile = await Voter.findOne({ userId: user._id }).select('-faceEmbedding');
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      voter: voterProfile
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = req.user;
    let voterProfile = null;
    if (user.role === 'voter') {
      voterProfile = await Voter.findOne({ userId: user._id }).select('-faceEmbedding');
    }
    res.json({ success: true, user, voter: voterProfile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Save face embedding after registration
 * @route   POST /api/auth/save-face
 * @access  Private
 */
const saveFaceEmbedding = async (req, res) => {
  try {
    const { faceEmbedding } = req.body;
    const voter = await Voter.findOne({ userId: req.user._id });
    if (!voter) return res.status(404).json({ success: false, message: 'Voter profile not found.' });

    voter.faceEmbedding = encrypt(faceEmbedding);
    await voter.save();

    res.json({ success: true, message: 'Face data saved securely.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, verifyOTP, login, getMe, saveFaceEmbedding };
