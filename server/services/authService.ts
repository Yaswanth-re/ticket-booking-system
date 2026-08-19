import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from '../db/index.js';
import { AppError } from '../errors.js';
import { createSession, createUser, findUserByEmail, findUserBySession, removeSession } from '../repositories/userRepository.js';
import type { User } from '../types.js';

const SESSION_DAYS = 7;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const loginFailures = new Map<string, number[]>();

interface Credentials {
  fullName?: unknown;
  email?: unknown;
  password?: unknown;
}

function validateEmail(value: unknown) {
  if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) throw new AppError('Enter a valid email address.');
  return value.trim().toLowerCase();
}

function validatePassword(value: unknown, isNewPassword = true) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) throw new AppError('Enter a valid password.');
  if (isNewPassword && (value.length < 10 || !/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value) || !/[^A-Za-z0-9]/.test(value))) {
    throw new AppError('Use 10+ characters with uppercase, lowercase, a number, and a symbol.');
  }
  return value;
}

function validateFullName(value: unknown) {
  if (typeof value !== 'string' || !/^[A-Za-z]{2,24}$/.test(value.trim())) throw new AppError('Use a simple first name: 2–24 letters only.');
  const name = value.trim().toLowerCase();
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

function assertLoginAllowed(email: string) {
  const now = Date.now();
  const attempts = (loginFailures.get(email) ?? []).filter((time) => now - time < LOGIN_WINDOW_MS);
  loginFailures.set(email, attempts);
  if (attempts.length >= MAX_LOGIN_ATTEMPTS) throw new AppError('Too many attempts. Please wait 15 minutes before trying again.', 429);
}

function recordFailedLogin(email: string) {
  const now = Date.now();
  const attempts = (loginFailures.get(email) ?? []).filter((time) => now - time < LOGIN_WINDOW_MS);
  loginFailures.set(email, [...attempts, now]);
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function passwordMatches(password: string, storedValue: string) {
  const [salt, storedHash] = storedValue.split(':');
  if (!salt || !storedHash) return false;
  const hash = scryptSync(password, salt, 64);
  const stored = Buffer.from(storedHash, 'hex');
  return stored.length === hash.length && timingSafeEqual(stored, hash);
}

function createAuthenticatedSession(user: User) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  createSession(user.id, token, expiresAt);
  return { user, token };
}

export function signUp(input: Credentials) {
  const fullName = validateFullName(input.fullName);
  const email = validateEmail(input.email);
  const password = validatePassword(input.password);
  const register = db.transaction(() => {
    if (findUserByEmail(email)) throw new AppError('An account with this email already exists.', 409);
    const user = createUser(fullName, email, hashPassword(password));
    return createAuthenticatedSession(user);
  });
  return register();
}

export function logIn(input: Credentials) {
  const email = validateEmail(input.email);
  const password = validatePassword(input.password, false);
  assertLoginAllowed(email);
  const login = db.transaction(() => {
    const user = findUserByEmail(email);
    if (!user || !passwordMatches(password, user.password_hash)) {
      recordFailedLogin(email);
      throw new AppError('Email or password is incorrect.', 401);
    }
    loginFailures.delete(email);
    return createAuthenticatedSession({ id: user.id, fullName: user.full_name, email: user.email });
  });
  return login();
}

export function getAuthenticatedUser(token: string) {
  return findUserBySession(token);
}

export function logOut(token: string) {
  removeSession(token);
}
