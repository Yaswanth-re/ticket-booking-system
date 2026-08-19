import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors.js';
import { getAuthenticatedUser } from '../services/authService.js';
import type { User } from '../types.js';

export const SESSION_COOKIE = 'ticketflow_session';

export function readSessionToken(request: Request) {
  const cookieHeader = request.headers.cookie ?? '';
  const cookie = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${SESSION_COOKIE}=`));
  return cookie ? decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1)) : undefined;
}

export function setSessionCookie(response: Response, token: string) {
  response.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const token = readSessionToken(request);
  const user = token ? getAuthenticatedUser(token) : undefined;
  if (!user) return next(new AppError('Please log in to continue.', 401));
  response.locals.user = user as User;
  return next();
}
