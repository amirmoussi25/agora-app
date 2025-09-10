import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export interface TokenPayload {
  userId: number;
  email: string;
  userType: 'client' | 'mairie';
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const generateResetToken = (): string => {
  return jwt.sign({ type: 'reset' }, JWT_SECRET, { expiresIn: '1h' });
};

export const generateVerificationToken = (): string => {
  return jwt.sign({ type: 'verification' }, JWT_SECRET, { expiresIn: '24h' });
};