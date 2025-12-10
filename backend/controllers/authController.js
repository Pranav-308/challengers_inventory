const jwt = require('jsonwebtoken');
const { findUserByUsername, findUserById, createUser, findUserByEmail, comparePassword } = require('../models/User');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Find user
    const user = await findUserByUsername(username.toLowerCase());

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Return user data and token
    res.json({
      _id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      notificationPreferences: user.notificationPreferences,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (user) {
      delete user.password;
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Admin sends invite email with code
// @route   POST /api/auth/invite
// @access  Private/Admin
const sendInvite = async (req, res) => {
  try {
    const { email, name } = req.body;

    // Check if email already exists
    const emailExists = await findUserByEmail(email.toLowerCase());
    if (emailExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate 6-digit code
    const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store invite in Firestore
    const { db } = require('../config/firebase');
    await db.collection('invites').add({
      email: email.toLowerCase(),
      name,
      code: inviteCode,
      expiresAt,
      invitedBy: req.user.id,
      used: false,
      createdAt: new Date(),
    });

    // Send email with code
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Welcome to Challengers Component Tracker!</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>You've been invited to join the Challengers team. Use the code below to create your account:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h1 style="color: #2563eb; font-size: 36px; letter-spacing: 8px; margin: 0;">${inviteCode}</h1>
        </div>
        <p><strong>Your email:</strong> ${email}</p>
        <p>This code expires in 24 hours. Visit the login page and click "Register with Code" to create your account.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">- Challengers Team</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '🔑 Your Challengers Invitation Code',
      html: emailHtml,
    });

    res.json({ message: 'Invitation sent successfully', email });
  } catch (error) {
    console.error('Send invite error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Member registers with invite code
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { email, code, username, password, phone } = req.body;

    // Find and validate invite
    const { db } = require('../config/firebase');
    const invitesSnapshot = await db.collection('invites')
      .where('email', '==', email.toLowerCase())
      .where('code', '==', code)
      .where('used', '==', false)
      .get();

    if (invitesSnapshot.empty) {
      return res.status(400).json({ message: 'Invalid or expired invitation code' });
    }

    const inviteDoc = invitesSnapshot.docs[0];
    const invite = inviteDoc.data();

    // Check expiration
    if (new Date() > invite.expiresAt.toDate()) {
      return res.status(400).json({ message: 'Invitation code expired' });
    }

    // Check if username exists
    const userExists = await findUserByUsername(username.toLowerCase());
    if (userExists) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Create user
    const user = await createUser({
      username: username.toLowerCase(),
      password,
      name: invite.name,
      email: email.toLowerCase(),
      phone,
      role: 'member',
      notificationPreferences: {
        email: true,
        whatsapp: false,
      },
    });

    // Mark invite as used
    await db.collection('invites').doc(inviteDoc.id).update({ used: true, usedAt: new Date() });

    res.status(201).json({
      _id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Request password reset code
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await findUserByEmail(email.toLowerCase());
    if (!user) {
      return res.status(404).json({ message: 'No account with that email' });
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store reset code
    const { db } = require('../config/firebase');
    await db.collection('passwordResets').add({
      email: email.toLowerCase(),
      code: resetCode,
      expiresAt,
      used: false,
      createdAt: new Date(),
    });

    // Send email
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ef4444;">Password Reset Request</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>You requested to reset your password. Use the code below:</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border-left: 4px solid #ef4444;">
          <h1 style="color: #ef4444; font-size: 36px; letter-spacing: 8px; margin: 0;">${resetCode}</h1>
        </div>
        <p>This code expires in 30 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">- Challengers Team</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '🔒 Password Reset Code',
      html: emailHtml,
    });

    res.json({ message: 'Reset code sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify invite code
// @route   POST /api/auth/verify-invite
// @access  Public
const verifyInviteCode = async (req, res) => {
  try {
    const { code } = req.body;

    const { db } = require('../config/firebase');
    const invitesSnapshot = await db.collection('invites')
      .where('code', '==', code)
      .where('used', '==', false)
      .get();

    if (invitesSnapshot.empty) {
      return res.status(400).json({ message: 'Invalid or expired invite code' });
    }

    const inviteDoc = invitesSnapshot.docs[0];
    const invite = inviteDoc.data();

    // Check expiration
    if (new Date() > invite.expiresAt.toDate()) {
      return res.status(400).json({ message: 'Invite code expired' });
    }

    res.json({
      valid: true,
      name: invite.name,
      email: invite.email,
    });
  } catch (error) {
    console.error('Verify invite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Complete registration with invite code
// @route   POST /api/auth/complete-registration
// @access  Public
const completeRegistration = async (req, res) => {
  try {
    const { inviteCode, username, password } = req.body;

    // Find and validate invite
    const { db } = require('../config/firebase');
    const invitesSnapshot = await db.collection('invites')
      .where('code', '==', inviteCode)
      .where('used', '==', false)
      .get();

    if (invitesSnapshot.empty) {
      return res.status(400).json({ message: 'Invalid or expired invite code' });
    }

    const inviteDoc = invitesSnapshot.docs[0];
    const invite = inviteDoc.data();

    // Check expiration
    if (new Date() > invite.expiresAt.toDate()) {
      return res.status(400).json({ message: 'Invite code expired' });
    }

    // Check if username already exists
    const { findUserByUsername, createUser } = require('../models/User');
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const userData = {
      username,
      password: hashedPassword,
      name: invite.name,
      email: invite.email,
      phone: '',
      role: 'member',
    };
    const user = await createUser(userData);

    // Mark invite as used
    await db.collection('invites').doc(inviteDoc.id).update({ 
      used: true, 
      usedAt: new Date(),
      registeredUserId: user.id,
    });

    // Generate token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        _id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset password with code
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    // Find and validate reset code
    const { db } = require('../config/firebase');
    const resetsSnapshot = await db.collection('passwordResets')
      .where('email', '==', email.toLowerCase())
      .where('code', '==', code)
      .where('used', '==', false)
      .get();

    if (resetsSnapshot.empty) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    const resetDoc = resetsSnapshot.docs[0];
    const reset = resetDoc.data();

    // Check expiration
    if (new Date() > reset.expiresAt.toDate()) {
      return res.status(400).json({ message: 'Reset code expired' });
    }

    // Update password
    const user = await findUserByEmail(email.toLowerCase());
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const { updateUser } = require('../models/User');
    await updateUser(user.id, { password: hashedPassword });

    // Mark reset as used
    await db.collection('passwordResets').doc(resetDoc.id).update({ used: true, usedAt: new Date() });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login,
  getMe,
  register,
  sendInvite,
  forgotPassword,
  resetPassword,
  verifyInviteCode,
  completeRegistration,
};
