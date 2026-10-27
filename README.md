# 🚀 Base para Prueba de Desempeño - NestJS & TypeORM

Plantilla base y boilerplate profesional desarrollado en **NestJS** diseñado para pruebas de desempeño, retos técnicos y evaluaciones de desarrollo backend.

Integra **PostgreSQL** mediante **TypeORM**, validación estricta de variables de entorno con **Zod**, validación dual de DTOs con **class-validator** y **Zod**, ciclo de vida HTTP completo (**Middlewares, Guards, Interceptors, Filters**) y suite de pruebas automatizadas con **Jest**.

---

## 🛠️ Tecnologías Utilizadas

- **Framework:** [NestJS](https://nestjs.com/) v12
- **Base de Datos:** PostgreSQL 16 con [TypeORM](https://typeorm.io/)
- **Validación de Entorno y DTOs:** [Zod](https://zod.dev/)
- **Validación Declarativa:** [class-validator](https://github.com/typestack/class-validator) & [class-transformer](https://github.com/typestack/class-transformer)
- **Autenticación & Autorización:** JWT (@nestjs/jwt), Bcrypt y RBAC
- **Testing:** [Jest](https://jestjs.io/) (Unitarias + E2E con soporte ESM)
- **Documentación API:** Swagger / OpenAPI en `/docs`
- **Contenedores:** Docker & Docker Compose

---

## 📂 Estructura del Proyecto

```text
base-prueba-nest.js/
├── docker-compose.yml                 # Servicio de PostgreSQL listo para levantar
├── .env.example                       # Plantilla de variables de entorno
├── .env                               # Variables de entorno locales (ignorado en git)
├── jest.config.ts                     # Configuración de Jest para pruebas unitarias (ESM)
├── jest-e2e.config.ts                 # Configuración de Jest para pruebas E2E (ESM)
├── src/
│   ├── app.module.ts                  # Módulo raíz: ensambla BD, guards, filtros, interceptores y middlewares globales
│   ├── main.ts                        # Bootstrap: Swagger (/docs), prefijo global (/api), CORS y ValidationPipe
│   ├── config/                        # ⚙️ Configuración centralizada
│   │   ├── env.schema.ts              # Esquema Zod para validar variables de entorno (.env)
│   │   └── typeorm.config.ts          # Conexión asíncrona TypeORM y DataSource para CLI
│   ├── common/                        # 🧩 Capa transversal y utilidades
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts  # @CurrentUser() -> Inyecta datos del JWT
│   │   │   ├── public.decorator.ts        # @Public() -> Hace un endpoint accesible sin token
│   │   │   └── roles.decorator.ts         # @Roles(Role.ADMIN) -> Restringe acceso por rol
│   │   ├── dto/
│   │   │   └── pagination.dto.ts          # DTO reutilizable para paginación (page, limit, skip)
│   │   ├── enums/
│   │   │   └── role.enum.ts               # Enumeración de roles del sistema (USER, ADMIN, etc.)
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts   # AllExceptionsFilter: Formato unificado de error y captura TypeORM
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts          # Guard global de JWT Bearer (respeta @Public())
│   │   │   └── roles.guard.ts             # Guard para autorización RBAC
│   │   ├── interceptors/
│   │   │   ├── response.interceptor.ts    # Envelope estándar { success: true, statusCode, data, timestamp }
│   │   │   └── logging.interceptor.ts     # Medición y log de tiempos de respuesta por controlador
│   │   ├── middleware/
│   │   │   └── logger.middleware.ts       # Logger HTTP con generación/propagación de x-request-id
│   │   └── pipes/
│   │       └── zod-validation.pipe.ts     # Pipe para validar peticiones con esquemas Zod
│   └── modules/                       # 📦 Módulos funcionales de la aplicación
│       ├── auth/                      # Autenticación (registro, login, perfil JWT)
│       ├── users/                     # CRUD de usuarios, entidad TypeORM, DTOs y validación Zod
│       └── health/                    # Health check de servidor y verificación de BD
└── test/
    ├── app.e2e-spec.ts                # Pruebas End-to-End con Jest y Supertest
    └── setup.ts                       # Configuración de entorno global para Jest ESM
```

---

## 🔄 Ciclo de Vida de las Peticiones en esta Base

Cada petición entrante recorre la siguiente arquitectura:

1. **Middleware (`LoggerMiddleware`):**
   - Asigna o propaga la cabecera `x-request-id` para trazabilidad única.
   - Registra método, ruta, IP, código HTTP y tiempo de respuesta en milisegundos.
2. **Guards Globales:**
   - **`JwtAuthGuard`:** Protege todas las rutas de la API por defecto. Si el endpoint tiene `@Public()`, permite el paso directo; si no, exige `Authorization: Bearer <token>`.
   - **`RolesGuard`:** Valida que el rol del usuario autenticado coincida con el requerido en `@Roles(...)`.
3. **Interceptors:**
   - **`LoggingInterceptor`:** Mide el tiempo de procesamiento específico del controlador.
   - **`ResponseInterceptor`:** Normaliza toda respuesta exitosa con la estructura:
     ```json
     {
       "success": true,
       "statusCode": 200,
       "timestamp": "2026-10-23T18:00:00.000Z",
       "data": { ... }
     }
     ```
4. **Pipes de Validación:**
   - **`ValidationPipe`:** Valida DTOs de `class-validator` descartando propiedades extrañas (`whitelist: true`, `forbidNonWhitelisted: true`).
   - **`ZodValidationPipe`:** Valida payloads contra esquemas de `zod`.
5. **Exception Filter (`AllExceptionsFilter`):**
   - Captura cualquier excepción `HttpException` o fallo de base de datos PostgreSQL (`23505` duplicado $\to$ 409 Conflict, `23503` clave foránea $\to$ 400 Bad Request, `22P02` formato inválido).
   - Devuelve un formato uniforme de error:
     ```json
     {
       "success": false,
       "statusCode": 400,
       "timestamp": "2026-10-23T18:00:00.000Z",
       "path": "/api/users",
       "method": "POST",
       "message": "Mensaje descriptivo del error",
       "errors": [ ... ]
     }
     ```

---

## 💡 Guía Rápida de Adaptación para tu Prueba (Cheat Sheet)

Todos los archivos contienen comentarios marcados con **`💡 [ADAPTAR PARA LA PRUEBA - ...]`**. Aquí tienes las adaptaciones más comunes:

### 1. ¿Cómo agregar un nuevo módulo y entidad?

1. Crea tu módulo y entidad en `src/modules/<tu-recurso>/`:
   ```bash
   # O manualmente creando carpeta y archivos
   nest g res modules/productos --no-spec
   ```
2. Define la entidad TypeORM en `src/modules/<recurso>/entities/<recurso>.entity.ts`.
3. Regístrala en su módulo:
   ```typescript
   @Module({
     imports: [TypeOrmModule.forFeature([Producto])],
     controllers: [ProductosController],
     providers: [ProductosService],
     exports: [ProductosService],
   })
   export class ProductosModule {}
   ```
4. Agrégala en `src/app.module.ts` dentro de `imports: [...]`.

### 2. ¿Cómo hacer un endpoint público o protegido por rol?

```typescript
// Endpoint público (cualquiera puede acceder)
@Public()
@Get('catalogo')
obtenerCatalogo() { ... }

// Endpoint protegido para cualquier usuario autenticado
@Get('mi-cuenta')
obtenerCuenta(@CurrentUser() user: JwtPayload) { ... }

// Endpoint restringido solo para administradores
@Roles(Role.ADMIN)
@Delete(':id')
eliminar(@Param('id', ParseUUIDPipe) id: string) { ... }
```

### 3. ¿Cómo usar DTOs con class-validator o con Zod?

- **Con class-validator (Recomendado/Estándar):**
  ```typescript
  @Post()
  crear(@Body() createDto: CreateUserDto) {
    return this.service.create(createDto);
  }
  ```
- **Con Zod (Validación por Pipe):**
  ```typescript
  @Post('zod')
  crearZod(
    @Body(new ZodValidationPipe(createUserZodSchema)) body: CreateUserZodDto
  ) {
    return this.service.create(body);
  }
  ```

### 4. ¿Cómo obtener el usuario autenticado en el controlador?

```typescript
@Get('mis-ordenes')
obtenerMisOrdenes(@CurrentUser() user: JwtPayload) {
  return this.ordenesService.findByUserId(user.sub);
}

// O para inyectar solo una propiedad concreta:
@Post('crear')
crear(@CurrentUser('sub') userId: string, @Body() dto: CrearDto) { ... }
```

---

## ⚡ Guía de Inicio Rápido

### 1. Variables de Entorno

Copia la plantilla `.env.example` a `.env`:

```bash
cp .env.example .env
```

### 2. Iniciar PostgreSQL con Docker

```bash
docker compose up -d db
```

### 3. Ejecutar la Aplicación

```bash
# Modo desarrollo con recarga automática (watch)
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

### 4. Documentación Interactiva Swagger

Abre en tu navegador:
👉 **[http://localhost:3000/docs](http://localhost:3000/docs)**

---

## 🧪 Pruebas Automatizadas con Jest

El proyecto incluye soporte nativo para **Jest en módulos ESM**:

```bash
# Ejecutar todas las pruebas unitarias
npm test

# Ejecutar pruebas en modo observador
npm run test:watch

# Generar reporte de cobertura de código
npm run test:cov

# Ejecutar pruebas End-to-End (E2E)
npm run test:e2e
```

---

## 📡 Endpoints Base Incluidos

| Método   | Endpoint             | Acceso                       | Descripción                                                    |
| :------- | :------------------- | :--------------------------- | :------------------------------------------------------------- |
| `GET`    | `/api/health`        | Público (`@Public()`)        | Health check de la API y verificación de conexión a PostgreSQL |
| `POST`   | `/api/auth/register` | Público (`@Public()`)        | Registro de nuevo usuario (hashea contraseña con bcrypt)       |
| `POST`   | `/api/auth/login`    | Público (`@Public()`)        | Login de usuario y emisión de token JWT                        |
| `GET`    | `/api/auth/profile`  | Autenticado                  | Perfil del usuario autenticado (extraído con `@CurrentUser()`) |
| `POST`   | `/api/users`         | Admin (`@Roles(Role.ADMIN)`) | Creación de usuario con DTO `class-validator`                  |
| `POST`   | `/api/users/zod`     | Admin (`@Roles(Role.ADMIN)`) | Creación de usuario con `ZodValidationPipe`                    |
| `GET`    | `/api/users`         | Admin (`@Roles(Role.ADMIN)`) | Listado paginado de usuarios (`page`, `limit`)                 |
| `GET`    | `/api/users/:id`     | Admin (`@Roles(Role.ADMIN)`) | Búsqueda por UUID (`ParseUUIDPipe`)                            |
| `PATCH`  | `/api/users/:id`     | Admin (`@Roles(Role.ADMIN)`) | Actualización parcial de usuario                               |
| `DELETE` | `/api/users/:id`     | Admin (`@Roles(Role.ADMIN)`) | Eliminación de usuario                                         |
