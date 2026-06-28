import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { TokenPayload } from '../types';

const accessOptions: SignOptions = { expiresIn: config.jwt.accessExpires as SignOptions['expiresIn'] };
const refreshOptions: SignOptions = { expiresIn: config.jwt.refreshExpires as SignOptions['expiresIn'] };

export const generateAccessToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.accessSecret, accessOptions);
};

export const generateRefreshToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, refreshOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
};

export const generateResetToken = (): string => {
  return jwt.sign({ type: 'reset' }, config.jwt.accessSecret, { expiresIn: '1h' });
};
