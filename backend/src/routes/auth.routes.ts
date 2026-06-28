import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema,
  changePasswordSchema, updateProfileSchema,
} from '../validators';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', authenticate, authController.getMe);
router.put('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.put('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.delete('/account', authenticate, authController.deleteAccount);

export default router;
