import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';

export const register = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 201, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

export const login = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 200, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { refreshToken: token } = req.body;
    const result = await authService.refreshToken(token);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.forgotPassword(req.body);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.resetPassword(req.body);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.getMe(req.user!.id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user!.id, currentPassword, newPassword);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.updateProfile(req.user!.id, req.body);
    sendSuccess(res, result, 200, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { password } = req.body;
    const result = await authService.deleteAccount(req.user!.id, password);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
