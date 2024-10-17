import { IsBoolean, IsDefined, IsOptional, IsString, Length } from "class-validator";

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
