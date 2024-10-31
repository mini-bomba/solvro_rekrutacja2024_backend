import { BadRequestException, Body, ConflictException, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { IngredientDTO, CreateIngredientDTO, EditIngredientDTO, FilterIngredientsParams } from './ingredients.dto';
import { ApiBadRequestResponse, ApiConflictResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IngredientsService } from './ingredients.service';
import { SqliteError } from 'better-sqlite3';
import { DeleteObjectParams, GetObjectParams, UpdateObjectParams } from './common.dto';

@Controller('ingredients')
@ApiTags("ingredients")
export class IngredientsController {
  constructor(private readonly service: IngredientsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all defined ingredients' })
  getAll(@Query() params: FilterIngredientsParams): IngredientDTO[] {
    return this.service.getAll(params) as IngredientDTO[];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an ingredient by ID' })
  @ApiNotFoundResponse({ description: 'Requested ingredient does not exist' })
  get(@Param() params: GetObjectParams): IngredientDTO {
    const result = this.service.get(params.id);
    if (result == undefined) {
      throw new NotFoundException(`Ingredient with ID ${params.id} does not exist`);
    }
    return result as IngredientDTO;
  }

  @Post()
  @ApiOperation({ summary: "Create a new ingredient" })
  @ApiConflictResponse({ description: "Ingredient with this name already exists" })
  create(@Body() body: CreateIngredientDTO): IngredientDTO {
    try {
      return this.service.create(body) as IngredientDTO;
    } catch (e) {
      if (!(e instanceof SqliteError)) throw e;

      switch (e.code) {
        case "SQLITE_CONSTRAINT_UNIQUE":
          throw new ConflictException("Ingredient with this name already exists");
        default:
          throw e;
      }
    }
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "Delete an ingredient" })
  @ApiNoContentResponse({ description: "Ingredient deleted successfully" })
  @ApiConflictResponse({ description: "This ingredient is in use" })
  @ApiNotFoundResponse({ description: "Ingredient does not exist" })
  delete(@Param() params: DeleteObjectParams) {
    try {
      if (!this.service.delete(params.id))
        throw new NotFoundException(`Ingredient with ID ${params.id} does not exist`)
    } catch (e) {
      if (!(e instanceof SqliteError)) throw e;

      switch (e.code) {
        case "SQLITE_CONSTRAINT_FOREIGNKEY":
          throw new ConflictException("This ingredient is in use");
        default:
          throw e;
      }
    }
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edit an ingredient", description: "Omit fields that should be left unmodified" })
  @ApiConflictResponse({ description: "Ingredient with this name already exists" })
  @ApiNotFoundResponse({ description: "Ingredient does not exist" })
  @ApiBadRequestResponse({ description: "No valid edits were specified, or you tried to set a required field to null" })
  update(@Param() params: UpdateObjectParams, @Body() body: EditIngredientDTO): IngredientDTO {
    try {
      const updated = this.service.update(params.id, body)
      if (updated == undefined) throw new NotFoundException(`Ingredient with ID ${params.id} does not exist`);
      return updated;
    } catch (e) {
      if (!(e instanceof SqliteError)) throw e;

      switch (e.code) {
        case "SQLITE_CONSTRAINT_UNIQUE":
          throw new ConflictException("Ingredient with this name already exists");
        case "SQLITE_CONSTRAINT_NOTNULL":
          const field = e.message.split('.')[1];
          throw new BadRequestException(`'${field}' is a required field and cannot be set to null`);
        default:
          throw e;
      }
    }
  }
}
