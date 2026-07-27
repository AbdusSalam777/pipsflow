import rateLimit from 'express-rate-limit';

/**
 * Login, register, and forgot-password are the endpoints a scripted attacker
 * actually cares about — the global 100/15min limiter is too loose to stop a
 * password-guessing run against a single account. This caps attempts per IP
 * independently of the rest of the API's traffic.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again in 15 minutes' },
  // Successful logins/registrations shouldn't count against the same budget
  // as failed ones — only failures should burn down the limit.
  skipSuccessfulRequests: true,
});
