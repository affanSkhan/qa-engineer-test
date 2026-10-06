import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from '../db/database.js';

const router = express.Router();
const JWT_SECRET = 'test-secret-key-do-not-use-in-production';

function validateEmail(email) {
  // Fix Bug C: require a hostname containing a top-level domain.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(email);
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, business_name } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (!business_name || business_name.trim().length < 2) {
      return res.status(400).json({ error: 'Business name is required' });
    }

    if (findUserByEmail(email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = createUser({
      email,
      password: hashedPassword,
      business_name,
      type: 'merchant'
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, type: 'merchant' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        business_name: newUser.business_name
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, type: user.type },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        business_name: user.business_name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
