import { Type } from "class-transformer";
import { IsArray, IsDefined, IsInt, IsNumber, IsOptional, IsPositive, IsString, Length, ValidateNested } from "class-validator";

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
