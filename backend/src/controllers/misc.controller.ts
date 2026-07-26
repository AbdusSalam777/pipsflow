import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { journalService, strategyRuleService } from '../services/journal.service';
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

export const createRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rule = await strategyRuleService.create(req.user!.id, req.body);
    sendSuccess(res, rule, 201);
  } catch (error) {
    next(error);
  }
};

export const getRules = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rules = await strategyRuleService.findAll(req.user!.id);
    sendSuccess(res, rules);
  } catch (error) {
    next(error);
  }
};

export const updateRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rule = await strategyRuleService.update(req.user!.id, String(req.params.id), req.body);
    sendSuccess(res, rule);
  } catch (error) {
    next(error);
  }
};

export const reorderRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rules = await strategyRuleService.reorder(
      req.user!.id,
      String(req.params.id),
      req.body.direction
    );
    sendSuccess(res, rules);
  } catch (error) {
    next(error);
  }
};

export const deleteRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await strategyRuleService.delete(req.user!.id, String(req.params.id));
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
