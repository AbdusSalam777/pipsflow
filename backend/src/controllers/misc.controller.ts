import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { journalService, goalService } from '../services/journal.service';
import { profileService } from '../services/profile.service';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';

export const createJournal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await journalService.create(req.user!.id, req.body);
    sendSuccess(res, entry, 201);
  } catch (error) {
    next(error);
  }
};

export const getJournals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entries = await journalService.findAll(req.user!.id);
    sendSuccess(res, entries);
  } catch (error) {
    next(error);
  }
};

export const getJournal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await journalService.findById(req.user!.id, String(req.params.id));
    sendSuccess(res, entry);
  } catch (error) {
    next(error);
  }
};

export const updateJournal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await journalService.update(req.user!.id, String(req.params.id), req.body);
    sendSuccess(res, entry);
  } catch (error) {
    next(error);
  }
};

export const deleteJournal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await journalService.delete(req.user!.id, String(req.params.id));
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const createGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const goal = await goalService.create(req.user!.id, req.body);
    sendSuccess(res, goal, 201);
  } catch (error) {
    next(error);
  }
};

export const getGoals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const goals = await goalService.findAll(req.user!.id);
    sendSuccess(res, goals);
  } catch (error) {
    next(error);
  }
};

export const getGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const goal = await goalService.findById(req.user!.id, String(req.params.id));
    sendSuccess(res, goal);
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const goal = await goalService.update(req.user!.id, String(req.params.id), req.body);
    sendSuccess(res, goal);
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await goalService.delete(req.user!.id, String(req.params.id));
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await profileService.getProfile(req.user!.id);
    sendSuccess(res, profile);
  } catch (error) {
    next(error);
  }
};

export const updateProfilePicture = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new Error('No file uploaded');
    const user = await profileService.updateProfilePicture(req.user!.id, req.file);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.updateProfile(req.user!.id, req.body);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const deleteProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { password } = req.body;
    const result = await authService.deleteAccount(req.user!.id, password);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
