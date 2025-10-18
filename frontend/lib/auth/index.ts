/**
 * Authentication Module Exports
 */

export {
  generateAuthMessage,
  verifyAuthSignature,
  authenticateRequest,
  createAuthHeaders,
  type AuthHeaders,
  type AuthResult,
} from './signature-auth';

export {
  RateLimiter,
  RATE_LIMITS,
  type RateLimitConfig,
} from './rate-limiter';

export {
  withAuth,
  withRateLimit,
  withAuthAndRateLimit,
  getClientIP,
  errorResponse,
  successResponse,
  type AuthenticatedRequest,
} from './middleware';
