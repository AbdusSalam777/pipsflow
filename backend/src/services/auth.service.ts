import bcrypt from 'bcryptjs';
import { User, PasswordResetToken } from '../models';
import { AppError } from '../utils/AppError';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { generateRandomToken, hashToken } from '../utils/token';
import { sendPasswordResetEmail } from './email.service';
import { config } from '../config';

export class AuthService {
  async register(data: { username: string; email: string; password: string }) {
    const existingUser = await User.findOne({
      $or: [{ email: data.email }, { username: data.username }],
    });

    if (existingUser) {
      if (existingUser.email === data.email) throw new AppError('Email already registered', 409);
      throw new AppError('Username already taken', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await User.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
    });

    const tokens = this.generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await User.findOne({ email: data.email });
    if (!user) throw new AppError('Invalid credentials', 401);

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) throw new AppError('Invalid credentials', 401);

    const tokens = this.generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    const { verifyRefreshToken } = await import('../utils/jwt');
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      throw new AppError('Invalid refresh token', 401);
    }

    const tokens = this.generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return tokens;
  }

  async forgotPassword(data: { username?: string; email?: string }) {
    const query = data.email ? { email: data.email } : { username: data.username };
    const user = await User.findOne(query);
    if (!user) throw new AppError('User not found', 404);

    const token = generateRandomToken();
    const hashedToken = hashToken(token);

    await PasswordResetToken.deleteMany({ userId: user._id });
    await PasswordResetToken.create({
      userId: user._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 3600000),
    });

    const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    return { message: 'Password reset link sent to your email' };
  }

  async resetPassword(data: { token: string; password: string }) {
    const hashedToken = hashToken(data.token);
    const resetToken = await PasswordResetToken.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() },
    });

    if (!resetToken) throw new AppError('Invalid or expired reset token', 400);

    const user = await User.findById(resetToken.userId);
    if (!user) throw new AppError('User not found', 404);

    user.password = await bcrypt.hash(data.password, 12);
    user.refreshToken = '';
    await user.save();
    await PasswordResetToken.deleteMany({ userId: user._id });

    return { message: 'Password reset successful' };
  }

  async getMe(userId: string) {
    const user = await User.findById(userId).select('-password -refreshToken');
    if (!user) throw new AppError('User not found', 404);
    return this.sanitizeUser(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new AppError('Current password is incorrect', 400);

    user.password = await bcrypt.hash(newPassword, 12);
    user.refreshToken = '';
    await user.save();

    return { message: 'Password changed successfully' };
  }

  async updateProfile(userId: string, data: { username?: string; email?: string }) {
    if (data.email) {
      const existing = await User.findOne({ email: data.email, _id: { $ne: userId } });
      if (existing) throw new AppError('Email already in use', 409);
    }
    if (data.username) {
      const existing = await User.findOne({ username: data.username, _id: { $ne: userId } });
      if (existing) throw new AppError('Username already taken', 409);
    }

    const user = await User.findByIdAndUpdate(userId, data, { new: true }).select(
      '-password -refreshToken'
    );
    if (!user) throw new AppError('User not found', 404);
    return this.sanitizeUser(user);
  }

  async deleteAccount(userId: string, password: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError('Incorrect password', 400);

    await User.findByIdAndDelete(userId);
    return { message: 'Account deleted successfully' };
  }

  private generateTokens(user: { _id: { toString: () => string }; email: string; username: string; role: string }) {
    const payload = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };
    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  private sanitizeUser(user: {
    _id: { toString: () => string };
    username: string;
    email: string;
    profilePicture?: string;
    role: string;
    createdAt: Date;
  }) {
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture || '',
      role: user.role,
      joinDate: user.createdAt,
    };
  }
}

export const authService = new AuthService();
