import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsDefined, IsOptional, IsString, Length } from "class-validator";
import { boolean_transform } from "./utils";

export class IngredientDTO {
  id: number;
  name: string;
  description: string;
  contains_alcohol: boolean;
  photo_url: string | null;
}

export class CreateIngredientDTO {
  @IsString()
  @Length(1, 128)
  @IsDefined()
  name: string;

  @IsString()
  @IsDefined()
  description: string;

  @IsBoolean()
  @IsDefined()
  contains_alcohol: boolean;

  @IsOptional()
  @IsString()
  photo_url?: string;
}

export class EditIngredientDTO {
  @IsString()
  @Length(1, 128)
  name?: string;

  @IsString()
  description?: string;
  
  @IsBoolean()
  contains_alcohol?: boolean;

  @IsString()
  photo_url?: string | null;
}

export class FilterIngredientsParams {
  @ApiProperty({
    required: false,
    description: 'Return only alcoholic or non-alcoholic ingredients. Omit to return both.',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(boolean_transform)
  contains_alcohol?: boolean;

  @ApiProperty({
    required: false,
    description: 'Return only ingredients with photos or without photos. Omit to return both.',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(boolean_transform)
  has_photo?: boolean;
}
