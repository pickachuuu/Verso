/**
 * Basic In-Memory Rate Limiter using a simple Map
 * Suitable for serverless environments (note: limits are per-instance).
 * For a distributed environment, consider using Redis/Upstash.
 */

const cache = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: { limit: number; windowMs: number }) {
  return function check(token: string): { success: boolean; headers: Record<string, string> } {
    const now = Date.now();
    let record = cache.get(token);

    if (record) {
      if (now > record.resetTime) {
        // window passed, reset
        record = { count: 1, resetTime: now + config.windowMs };
        cache.set(token, record);
      } else {
        record.count++;
      }
    } else {
      record = { count: 1, resetTime: now + config.windowMs };
      cache.set(token, record);
    }

    // Clean up old entries periodically to prevent memory leaks (lazy cleanup ~5% chance)
    if (Math.random() < 0.05) {
      for (const [key, val] of cache.entries()) {
        if (now > val.resetTime) {
          cache.delete(key);
        }
      }
    }

    const remaining = Math.max(0, config.limit - record.count);
    const success = record.count <= config.limit;

    return {
      success,
      headers: {
        'X-RateLimit-Limit': config.limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': record.resetTime.toString(),
      },
    };
  };
}

// Common rate limiters for our app
export const aiRateLimiter = rateLimit({
  limit: 10,       // 10 requests
  windowMs: 60000, // per 60 seconds (1 minute)
});
