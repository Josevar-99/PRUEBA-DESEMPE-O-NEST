import { z } from 'zod';

/**
 * 💡 [ADAPT FOR THE TEST - ENVIRONMENT VARIABLES]:
 * If the test specification requires new environment variables (for example:
 * API_KEY, REDIS_HOST, STRIPE_SECRET, CLOUDINARY_URL, etc.), add them to this schema.
 * Zod will validate them before the application starts, preventing runtime errors.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // 💡 Server port: modify or keep as-is according to the specification
  PORT: z.coerce.number().default(3000),
  APP_PORT: z.coerce.number().optional().default(3000),

  // 💡 Global route prefix (e.g.: 'api', 'api/v1', etc.)
  API_PREFIX: z.string().default('api'),

  // 💡 [POSTGRESQL DATABASE]:
  // Modify the names or default values according to the test case requirements
  POSTGRES_HOST: z.string().min(1, 'POSTGRES_HOST is required'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string().min(1, 'POSTGRES_USER is required'),
  POSTGRES_PASSWORD: z.string().min(1, 'POSTGRES_PASSWORD is required'),
  POSTGRES_DB: z.string().min(1, 'POSTGRES_DB is required'),

  // 💡 [JWT AUTHENTICATION]:
  // Secret key and expiration time (e.g.: '1h', '24h', '7d')
  JWT_SECRET: z
    .string()
    .min(8, 'JWT_SECRET must contain at least 8 characters'),
  JWT_EXPIRES_IN: z.string().default('1d'),

  // 💡 EXAMPLE: If the test requires an external API Key, uncomment and adjust:
  API_KEY: z.string().min(16, 'API_KEY must be at least 16 characters'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Environment validator passed to ConfigModule.forRoot({ validate: validateEnv })
 */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errorMessages = result.error.issues
      .map((issue) => `[${issue.path.join('.')}]: ${issue.message}`)
      .join('\n  ');

    throw new Error(
      `\n❌ Environment variable validation error (.env):\n  ${errorMessages}\n`,
    );
  }

  return result.data;
}
