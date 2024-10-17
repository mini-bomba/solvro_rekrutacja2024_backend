import { IsDefined, IsString, Length } from "class-validator";

export class CategoryDTO {
  id: number;
  name: string;
}

export class CreateCategoryDTO {
  @IsString()
  @Length(1, 128)
  @IsDefined()
  name: string;
}
