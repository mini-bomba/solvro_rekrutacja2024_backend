import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsDefined, IsInt, IsNumber, IsOptional, IsPositive, IsString, Length, Min, ValidateNested } from "class-validator";
import { boolean_transform } from "./utils";

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

export class FilterCoctailsParams {
  @ApiProperty({
    required: false,
    description: 'Return only alcoholic or non-alcoholic coctails. Omit to return both.',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(boolean_transform)
  contains_alcohol?: boolean;

  @ApiProperty({
    required: false,
    description: 'Return only coctails from this category. Omit to return all.',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  category_id?: number;

  @ApiProperty({
    required: false,
    description: 'Return only coctails that contain this ingredient. Omit to return all.',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  ingredient_id?: number;
}
