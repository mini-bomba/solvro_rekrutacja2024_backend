import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { CoctailsService } from './coctails.service';
import { CoctailDTO, CreateCoctailDTO, EditCoctailDTO } from './coctails.dto';
import { ApiBadRequestResponse, ApiConflictResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';
import { DeleteObjectParams, GetObjectParams, UpdateObjectParams } from './common.dto';
import { Coctail } from './db_types';

@Controller('coctails')
export class CoctailsController {
  constructor(private readonly service: CoctailsService) {}

  private addIngredientInfo(dbObj: Coctail): CoctailDTO {
    const ingredients = this.service.getIngredients(dbObj.id);
    return {
      id: dbObj.id,
      name: dbObj.name,
      category_id: dbObj.category,
      instructions: dbObj.instructions,
      ingredients: ingredients.map(i => {return {
        id: i.ingredient_id,
        amount: i.amount,
      }}),
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all defined coctails' })
  getAll(): CoctailDTO[] {
    return this.service.getAll().map(this.addIngredientInfo.bind(this));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a coctail by ID' })
  @ApiNotFoundResponse({ description: 'Requested coctail does not exist' })
  get(@Param() params: GetObjectParams): CoctailDTO {
    const result = this.service.get(params.id);
    if (result == undefined) {
      throw new NotFoundException(`Coctail with ID ${params.id} does not exist`);
    }
    return this.addIngredientInfo(result);
  }

  @Post()
  @ApiOperation({ summary: "Create a new coctail" })
  @ApiConflictResponse({ description: "Coctail with this name already exists" })
  @ApiNotFoundResponse({ description: "Category or ingredient referenced by the definition does not exist" })
  @ApiBadRequestResponse({ description: "Bad input data (negative ingredient amounts, etc.)" })
  create(@Body() body: CreateCoctailDTO): CoctailDTO {
    return this.addIngredientInfo(this.service.create(body));
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "Delete an coctail" })
  @ApiNoContentResponse({ description: "Coctail deleted successfully" })
  @ApiNotFoundResponse({ description: "Coctail does not exist" })
  delete(@Param() params: DeleteObjectParams) {
    if (!this.service.delete(params.id))
      throw new NotFoundException(`Coctail with ID ${params.id} does not exist`)
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edit a coctail", description: "Omit fields that should be left unmodified" })
  @ApiConflictResponse({ description: "Coctail with this name already exists" })
  @ApiNotFoundResponse({ description: "Coctail, category or ingredient does not exist" })
  @ApiBadRequestResponse({ description: "No valid edits were specified, or you tried to set a required field to null" })
  update(@Param() params: UpdateObjectParams, @Body() body: EditCoctailDTO): CoctailDTO {
    return this.addIngredientInfo(this.service.update(params.id, body))
  }
}
