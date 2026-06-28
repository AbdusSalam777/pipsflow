import api from './api';
import { ApiResponse, User } from '@/types';

export const authApi = {
  register: (data: { username: string; email: string; password: string; confirmPassword: string }) =>
    api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/register', data),

  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', data),

  forgotPassword: (data: { username?: string; email?: string }) =>
    api.post<ApiResponse<{ message: string }>>('/auth/forgot-password', data),

  resetPassword: (data: { token: string; password: string; confirmPassword: string }) =>
    api.post<ApiResponse<{ message: string }>>('/auth/reset-password', data),

  getMe: () => api.get<ApiResponse<User>>('/auth/me'),

  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    api.put<ApiResponse<{ message: string }>>('/auth/change-password', data),

  updateProfile: (data: { username?: string; email?: string }) =>
    api.put<ApiResponse<User>>('/auth/profile', data),

  deleteAccount: (password: string) =>
    api.delete<ApiResponse<{ message: string }>>('/auth/account', { data: { password } }),
};
