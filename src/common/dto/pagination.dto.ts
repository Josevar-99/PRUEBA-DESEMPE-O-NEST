import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * 💡 [ADAPT FOR THE TEST - GENERIC PAGINATION DTO]:
 * Use it as query params in GET list endpoints (e.g.: `@Query() paginationDto: PaginationDto`).
 *
 * 💡 COMMON EXTENSIONS IN TESTS:
 * If search filters or sorting are required, you can add:
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
  @IsInt({ message: 'The page field must be an integer' })
  @Min(1, { message: 'The minimum page number is 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'The limit field must be an integer' })
  @Min(1, { message: 'The minimum limit is 1' })
  @Max(100, { message: 'The maximum limit per page is 100' })
  limit?: number = 10;

  /**
   * Calculates the offset for TypeORM: `skip = (page - 1) * limit`
   */
  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 10);
  }
}
