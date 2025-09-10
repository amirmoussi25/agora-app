import { NextRequest } from 'next/server';
import { verifyToken, TokenPayload } from '../utils/jwt';

export interface AuthenticatedRequest extends NextRequest {
  user: TokenPayload;
}

export const authenticateToken = (request: NextRequest): TokenPayload | null => {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    return verifyToken(token);
  } catch (error) {
    return null;
  }
};

export const requireAuth = (request: NextRequest): { user: TokenPayload | null; error: string | null } => {
  const user = authenticateToken(request);
  
  if (!user) {
    return { user: null, error: 'Token d\'authentification requis' };
  }
  
  return { user, error: null };
};

export const requireUserType = (
  request: NextRequest,
  allowedTypes: ('client' | 'mairie')[]
): { user: TokenPayload | null; error: string | null } => {
  const { user, error } = requireAuth(request);
  
  if (error || !user) {
    return { user: null, error: error || 'Authentification requise' };
  }
  
  if (!allowedTypes.includes(user.userType)) {
    return { user: null, error: 'Accès non autorisé pour ce type d\'utilisateur' };
  }
  
  return { user, error: null };
};