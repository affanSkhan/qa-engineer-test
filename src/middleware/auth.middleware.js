import jwt from 'jsonwebtoken';
import { findUserById } from '../db/database.js';

const JWT_SECRET = 'test-secret-key-do-not-use-in-production';

export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      type: decoded.type
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    if (error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    return res.status(500).json({ error: 'Authentication failed' });
  }
}
