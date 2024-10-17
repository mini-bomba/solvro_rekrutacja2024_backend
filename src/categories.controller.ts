import { Body, ConflictException, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { CategoryDTO, CreateCategoryDTO } from './categories.dto';
import { ApiConflictResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { SqliteError } from 'better-sqlite3';
import { DeleteObjectParams, GetObjectParams, UpdateObjectParams } from './common.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all defined categories' })
  getAll(): CategoryDTO[] {
    return this.service.getAll() as CategoryDTO[];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiNotFoundResponse({ description: 'Requested category does not exist' })
  get(@Param() params: GetObjectParams): CategoryDTO {
    const result = this.service.get(params.id);
    if (result == undefined) {
      throw new NotFoundException(`Category with ID ${params.id} does not exist`);
    }
    return result as CategoryDTO;
  }

  @Post()
  @ApiOperation({ summary: "Create a new category" })
  @ApiConflictResponse({ description: "Category with this name already exists" })
  create(@Body() body: CreateCategoryDTO): CategoryDTO {
    try {
      return this.service.create(body) as CategoryDTO;
    } catch (e) {
      if (!(e instanceof SqliteError)) throw e;

      switch (e.code) {
        case "SQLITE_CONSTRAINT_UNIQUE":
          throw new ConflictException("Category with this name already exists");
        default:
          throw e;
      }
    }
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a category" })
  @ApiNoContentResponse({ description: "Category deleted successfully" })
  @ApiConflictResponse({ description: "This category is in use" })
  @ApiNotFoundResponse({ description: "Category does not exist" })
  delete(@Param() params: DeleteObjectParams) {
    try {
      if (!this.service.delete(params.id))
        throw new NotFoundException(`Category with ID ${params.id} does not exist`)
    } catch (e) {
      if (!(e instanceof SqliteError)) throw e;

      switch (e.code) {
        case "SQLITE_CONSTRAINT_FOREIGNKEY":
          throw new ConflictException("This category is in use");
        default:
          throw e;
      }
    }
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edit a category" })
  @ApiConflictResponse({ description: "Category with this name already exists" })
  @ApiNotFoundResponse({ description: "Category does not exist" })
  update(@Param() params: UpdateObjectParams, @Body() body: CreateCategoryDTO): CategoryDTO {
    try {
      const updated = this.service.update(params.id, body)
      if (updated == undefined) throw new NotFoundException(`Category with ID ${params.id} does not exist`);
      return updated;
    } catch (e) {
      if (!(e instanceof SqliteError)) throw e;

      switch (e.code) {
        case "SQLITE_CONSTRAINT_UNIQUE":
          throw new ConflictException("Category with this name already exists");
        default:
          throw e;
      }
    }
  }
}
