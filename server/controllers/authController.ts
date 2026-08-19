import type { NextFunction, Request, Response } from 'express';
import { clearSessionCookie, readSessionToken, setSessionCookie } from '../middleware/auth.js';
import { getAuthenticatedUser, logIn, logOut, signUp } from '../services/authService.js';

export function signup(request: Request, response: Response, next: NextFunction) {
  try {
    const result = signUp(request.body);
    setSessionCookie(response, result.token);
    response.status(201).json({ user: result.user });
  } catch (error) { next(error); }
}

export function login(request: Request, response: Response, next: NextFunction) {
  try {
    const result = logIn(request.body);
    setSessionCookie(response, result.token);
    response.json({ user: result.user });
  } catch (error) { next(error); }
}

export function logout(request: Request, response: Response, next: NextFunction) {
  try {
    const token = readSessionToken(request);
    if (token) logOut(token);
    clearSessionCookie(response);
    response.status(204).send();
  } catch (error) { next(error); }
}

export function me(request: Request, response: Response, next: NextFunction) {
  try {
    const token = readSessionToken(request);
    const user = token ? getAuthenticatedUser(token) : undefined;
    return response.json({ user: user ?? null });
  } catch (error) { return next(error); }
}
