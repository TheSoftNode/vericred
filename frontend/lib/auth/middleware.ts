/**
 * API Route Middleware
 * Authentication and rate limiting for Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { type Address } from 'viem';
import { authenticateRequest } from './signature-auth';
import { RateLimiter, type RateLimitConfig } from './rate-limiter';

export interface AuthenticatedRequest {
  address: Address;
  headers: Headers;
}

/**
 * Wrap API route with authentication
 */
export function withAuth<T = any>(
  handler: (req: NextRequest, auth: AuthenticatedRequest) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Authenticate request
      const auth = await authenticateRequest(req.headers);

      if (!auth) {
        return NextResponse.json(
          {
            error: 'Unauthorized',
            message: 'Invalid or missing authentication',
            code: 'UNAUTHORIZED',
          },
          { status: 401 }
        );
      }

      // Call handler with authenticated request
      return await handler(req, {
        address: auth.address,
        headers: req.headers,
      });
    } catch (error: any) {
      console.error('Authentication error:', error);

      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: error.message || 'Unknown error',
          code: 'AUTH_ERROR',
        },
        { status: 401 }
      );
    }
  };
}

/**
 * Wrap API route with rate limiting
 */
export function withRateLimit<T = any>(
  handler: (req: NextRequest) => Promise<NextResponse<T>>,
  config: RateLimitConfig
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Try to get address from headers
      const address = req.headers.get('x-address');

      let rateLimit;

      if (address) {
        // Rate limit by address
        rateLimit = await RateLimiter.checkByAddress(address, config);
      } else {
        // Rate limit by IP
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        rateLimit = await RateLimiter.checkByIP(ip, config);
      }

      // Add rate limit headers
      const response = rateLimit.allowed
        ? await handler(req)
        : NextResponse.json(
            {
              error: 'Rate limit exceeded',
              message: `Too many requests. Please try again later.`,
              code: 'RATE_LIMIT_EXCEEDED',
              resetAt: rateLimit.resetAt.toISOString(),
            },
            { status: 429 }
          );

      // Add rate limit info to response headers
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimit.resetAt.toISOString());

      return response;
    } catch (error: any) {
      console.error('Rate limit error:', error);

      // If rate limiter fails, allow request but log error
      return await handler(req);
    }
  };
}

/**
 * Combine authentication and rate limiting
 */
export function withAuthAndRateLimit<T = any>(
  handler: (req: NextRequest, auth: AuthenticatedRequest) => Promise<NextResponse<T>>,
  config: RateLimitConfig
) {
  return withRateLimit(
    withAuth(handler),
    config
  );
}

/**
 * Get client IP from request
 */
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Error response helper
 */
export function errorResponse(
  error: string,
  message: string,
  code: string,
  status: number = 400
): NextResponse {
  return NextResponse.json(
    {
      error,
      message,
      code,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}
