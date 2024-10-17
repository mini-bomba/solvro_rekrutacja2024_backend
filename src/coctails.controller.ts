import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { CoctailsService } from './coctails.service';
import { CoctailContentDTO, CoctailDTO, CreateCoctailDTO, DeleteCoctailIngredientParams, EditCoctailDTO, EditCoctailIngredientDTO, EditCoctailIngredientParams, GetCoctailIngredientParams } from './coctails.dto';
import { ApiBadRequestResponse, ApiConflictResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeleteObjectParams, GetObjectParams, UpdateObjectParams } from './common.dto';
import { Coctail, CoctailContent } from './db_types';
import { IngredientsService } from './ingredients.service';
import { SqliteError } from 'better-sqlite3';

@Controller('coctails')
@ApiTags("coctails")
export class CoctailsController {
  constructor(private readonly service: CoctailsService, private readonly ingredientsService: IngredientsService) {}

  private addIngredientInfo(dbObj: Coctail): CoctailDTO {
    const ingredients = this.service.getIngredients(dbObj.id);
    return {
      id: dbObj.id,
      name: dbObj.name,
      category_id: dbObj.category,
      instructions: dbObj.instructions,
      ingredients: ingredients.map(this.dbIngredientToAPI.bind(this)),
    }
  }

  private dbIngredientToAPI(dbObj: CoctailContent): CoctailContentDTO {
    return {
      id: dbObj.ingredient_id,
      amount: dbObj.amount,
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

  @Get(':id/ingredients')
  @ApiOperation({ summary: "List ingredients of a coctail" })
  @ApiNotFoundResponse({ description: 'Requested coctail does not exist' })
  getIngredients(@Param() params: GetObjectParams): CoctailContentDTO[] {
    if (!this.service.exists(params.id)) {
      throw new NotFoundException(`Coctail with ID ${params.id} does not exist`);
    }
    return this.service.getIngredients(params.id).map(this.dbIngredientToAPI.bind(this));
  }

  @Get(':coctail_id/ingredients/:ingredient_id')
  @ApiOperation({
    summary: "Get info about a specific ingredient's usage in a coctail" ,
    description: "This endpoint will always return an object if the coctail and ingredient exist. The coctail does not need to contain the ingredient, the amount returned will be 0 in that case."
  })
  @ApiNotFoundResponse({ description: 'Requested coctail or ingredient does not exist' })
  getIngredient(@Param() params: GetCoctailIngredientParams): CoctailContentDTO {
    if (!this.service.exists(params.coctail_id)) {
      throw new NotFoundException(`Coctail with ID ${params.coctail_id} does not exist`);
    }
    if (!this.ingredientsService.exists(params.ingredient_id)) {
      throw new NotFoundException(`Ingredient with ID ${params.ingredient_id} does not exist`);
    }
    return this.dbIngredientToAPI(this.service.getIngredient(params.coctail_id, params.ingredient_id) ?? { ingredient_id: params.ingredient_id, amount: 0 });
  }

  @Post(':coctail_id/ingredients/:ingredient_id')
  @ApiOperation({
    summary: "Add or update an ingredient's usage in a coctail",
    description: "If the coctail doesn't contain this ingredient: add the ingredient to the coctail's contents.\n\n" + 
                 "If the coctail already contains this ingredient: update the ingredient's usage in the coctail.\n\n" +
                 "If the amount is set to 0: remove this ingredient from the coctail."
  })
  @ApiNotFoundResponse({ description: 'Requested coctail or ingredient does not exist' })
  setIngredient(@Param() params: EditCoctailIngredientParams, @Body() body: EditCoctailIngredientDTO): CoctailContentDTO {
    if (!this.service.exists(params.coctail_id)) {
      throw new NotFoundException(`Coctail with ID ${params.coctail_id} does not exist`);
    }
    if (body.amount === 0) {
      this.service.removeIngredient(params.coctail_id, params.ingredient_id);
      return { id: params.ingredient_id, amount: 0 };
    }
    try {
      return this.dbIngredientToAPI(this.service.setIngredient(params.coctail_id, params.ingredient_id, body));
    } catch (e) {
      if (!(e instanceof SqliteError)) throw e;

      switch (e.code) {
        case "SQLITE_CONSTRAINT_FOREIGNKEY":
          throw new NotFoundException(`Ingredient with id '${params.ingredient_id}' doesn't exist`);
        default:
          throw e;
      }
    }
  }

  @Delete(':coctail_id/ingredients/:ingredient_id')
  @HttpCode(204)
  @ApiOperation({ summary: "Remove an ingredient from a coctail" })
  @ApiNotFoundResponse({ description: 'Requested coctail or ingredient does not exist' })
  removeIngredient(@Param() params: DeleteCoctailIngredientParams) {
    if (!this.service.exists(params.coctail_id)) {
      throw new NotFoundException(`Coctail with ID ${params.coctail_id} does not exist`);
    }
    if (!this.ingredientsService.exists(params.ingredient_id)) {
      throw new NotFoundException(`Ingredient with ID ${params.ingredient_id} does not exist`);
    }
    this.service.removeIngredient(params.coctail_id, params.ingredient_id);
  }
}
