import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsDefined, IsInt, IsNumber, IsOptional, IsPositive, IsString, Length, Min, ValidateNested } from "class-validator";

export class CoctailDTO {
  id: number;
  name: string;
  category_id: number;
  instructions: string;
  ingredients: CoctailContentDTO[];
}

export class CoctailContentDTO {
  id: number;
  amount: number;
}

export class CreateCoctailDTO {
  @IsString()
  @Length(1, 128)
  @IsDefined()
  name: string;

  @IsInt()
  @IsDefined()
  category_id: number;

  @IsString()
  @IsDefined()
  instructions: string;

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => InitialCoctailContentDTO)
  ingredients?: InitialCoctailContentDTO[];
}

export class InitialCoctailContentDTO {
  @IsInt()
  @IsDefined()
  id: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsPositive()
  @IsDefined()
  amount: number;
}

export class EditCoctailDTO {
  @IsString()
  @Length(1, 128)
  name?: string;

  @IsInt()
  category_id?: number;

  @IsString()
  instructions?: string;

  @IsArray()
  @ValidateNested()
  @Type(() => InitialCoctailContentDTO)
  ingredients?: InitialCoctailContentDTO[];
}

export class GetCoctailIngredientParams {
  @ApiProperty({
    required: true,
    description: 'ID of the coctail to be queried',
  })
  @IsInt()
  @Type(() => Number)
  coctail_id: number;
  
  @ApiProperty({
    required: true,
    description: 'ID of the ingredient to be retrieved',
  })
  @IsInt()
  @Type(() => Number)
  ingredient_id: number;
}

export class EditCoctailIngredientDTO {
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  amount: number;
}

export class EditCoctailIngredientParams {
  @ApiProperty({
    required: true,
    description: 'ID of the coctail to be edited',
  })
  @IsInt()
  @Type(() => Number)
  coctail_id: number;
  
  @ApiProperty({
    required: true,
    description: 'ID of the ingredient to be edited',
  })
  @IsInt()
  @Type(() => Number)
  ingredient_id: number;
}

export class DeleteCoctailIngredientParams {
  @ApiProperty({
    required: true,
    description: 'ID of the coctail to be edited',
  })
  @IsInt()
  @Type(() => Number)
  coctail_id: number;
  
  @ApiProperty({
    required: true,
    description: 'ID of the ingredient to be removed from the coctail',
  })
  @IsInt()
  @Type(() => Number)
  ingredient_id: number;
}
