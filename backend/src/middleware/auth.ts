import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    allowedPages?: string[];
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    // Always load fresh user data from DB to get current role and name
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: { select: { name: true, allowedPages: true } } },
    });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      role: user.role?.name || 'user',
      allowedPages: user.role?.allowedPages || [],
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
