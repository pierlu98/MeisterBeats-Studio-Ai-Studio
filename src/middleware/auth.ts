import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }

  // Attach user to the request object for use in subsequent routes
  (req as any).user = user;
  next();
};
