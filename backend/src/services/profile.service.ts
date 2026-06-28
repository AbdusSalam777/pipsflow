import { Trade } from '../models';
import { analyticsService } from './analytics.service';
import { uploadImage } from './cloudinary.service';
import { AppError } from '../utils/AppError';

export class ProfileService {
  async getProfile(userId: string) {
    const { authService } = await import('./auth.service');
    const user = await authService.getMe(userId);
    const trades = await Trade.find({ userId });
    const metrics = await analyticsService.getDashboard(userId);

    return {
      ...user,
      totalTrades: trades.length,
      winRate: metrics.summary.winRate,
      lifetimePnL: metrics.summary.totalPnL,
    };
  }

  async updateProfilePicture(userId: string, file: Express.Multer.File) {
    const { User } = await import('../models');
    const uploaded = await uploadImage(file.buffer, 'profiles');
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: uploaded.url },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) throw new AppError('User not found', 404);
    return user;
  }
}

export const profileService = new ProfileService();
