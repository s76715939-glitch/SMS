import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { findAdminByUsername } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bkash-nagad-mfs-secure-gateway-jwt-key-2026-b827e4';
const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  id: string;
  username: string;
  role: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJwtToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication token required',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJwtToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or expired token',
      });
    }

    const admin = await findAdminByUsername(decoded.username);
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Admin user not found',
      });
    }

    (req as any).user = {
      id: admin._id,
      username: admin.username,
      role: admin.role || 'admin',
    };

    next();
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Authentication verification error',
      details: err.message,
    });
  }
}
