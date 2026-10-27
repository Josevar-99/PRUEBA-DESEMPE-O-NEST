import { z } from 'zod';

/**
 * 💡 [ADAPTAR PARA LA PRUEBA - VARIABLES DE ENTORNO]:
 * Si el enunciado de la prueba solicita nuevas variables de entorno (por ejemplo:
 * API_KEY, REDIS_HOST, STRIPE_SECRET, CLOUDINARY_URL, etc.), agrégalas a este esquema.
 * Zod las validará antes de que la aplicación arranque, previniendo errores en tiempo de ejecución.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // 💡 Puerto del servidor: modificar o mantener según enunciado
  PORT: z.coerce.number().default(3000),
  APP_PORT: z.coerce.number().optional().default(3000),

  // 💡 Prefijo global de rutas (ej: 'api', 'api/v1', etc.)
  API_PREFIX: z.string().default('api'),

  // 💡 [BASE DE DATOS POSTGRESQL]:
  // Modifica los nombres o valores por defecto según las exigencias del caso de prueba
  POSTGRES_HOST: z.string().min(1, 'POSTGRES_HOST es obligatorio'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string().min(1, 'POSTGRES_USER es obligatorio'),
  POSTGRES_PASSWORD: z.string().min(1, 'POSTGRES_PASSWORD es obligatorio'),
  POSTGRES_DB: z.string().min(1, 'POSTGRES_DB es obligatorio'),

  // 💡 [AUTENTICACIÓN JWT]:
  // Clave secreta y tiempo de expiración (ej: '1h', '24h', '7d')
  JWT_SECRET: z
    .string()
    .min(8, 'JWT_SECRET debe contener al menos 8 caracteres'),
  JWT_EXPIRES_IN: z.string().default('1d'),

  // 💡 EJEMPLO: Si la prueba pide una API Key externa, descomenta y ajusta:
  API_KEY: z.string().min(16, 'API_KEY debe tener al menos 16 caracteres'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validador de entorno que se pasa a ConfigModule.forRoot({ validate: validateEnv })
 */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errorMessages = result.error.issues
      .map((issue) => `[${issue.path.join('.')}]: ${issue.message}`)
      .join('\n  ');

    throw new Error(
      `\n❌ Error de validación en variables de entorno (.env):\n  ${errorMessages}\n`,
    );
  }

  return result.data;
}
