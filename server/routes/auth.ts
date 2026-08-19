import { Router } from 'express';
import { login, logout, me, signup } from '../controllers/authController.js';

export const authRouter = Router();
authRouter.post('/signup', signup);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.get('/me', me);
