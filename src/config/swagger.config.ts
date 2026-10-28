import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * OpenAPI documentation at /docs (requirement 10.5).
 * Registers both API security schemes to test them from the Authorize button:
 * - Bearer: JWT for users (login).
 * - x-api-key: key for external integrations. The name 'x-api-key' must match
 *   the one in @ApiSecurity('x-api-key') in IntegrationsController.
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Workshop API')
    .setDescription(
      'Management of the vehicle fleet maintenance lifecycle',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config), {
    // Keeps the token on page reload; avoids re-logging in during tests
    swaggerOptions: { persistAuthorization: true },
  });
}
