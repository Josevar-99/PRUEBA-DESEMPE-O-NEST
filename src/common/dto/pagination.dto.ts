import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * 💡 [ADAPTAR PARA LA PRUEBA - DTO DE PAGINACIÓN GENÉRICO]:
 * Utilízalo como query params en endpoints GET de listado (ej: `@Query() paginationDto: PaginationDto`).
 *
 * 💡 EXTENSIONES FRECUENTES EN PRUEBAS:
 * Si te piden filtros de búsqueda o ordenamiento, puedes agregar:
 *   @IsOptional()
 *   @IsString()
 *   search?: string;
 *
 *   @IsOptional()
 *   @IsIn(['ASC', 'DESC'])
 *   order?: 'ASC' | 'DESC' = 'DESC';
 *
 *   @IsOptional()
 *   @IsString()
 *   sortBy?: string = 'createdAt';
 */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El campo page debe ser un número entero' })
  @Min(1, { message: 'El número mínimo de página es 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El campo limit debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo por página es 100' })
  limit?: number = 10;

  /**
   * Calcula el offset para TypeORM: `skip = (page - 1) * limit`
   */
  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 10);
  }
}
