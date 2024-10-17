export class IngredientDTO {
  id: number;
  name: string;
  description: string;
  contains_alcohol: boolean;
  photo_url: string | null;
}

export class CreateIngredientDTO {
  name: string;
  description: string;
  contains_alcohol: boolean;
  photo_url?: string;
}

export class EditIngredientDTO {
  name?: string;
  description?: string;
  contains_alcohol?: boolean;
  photo_url?: string | null;
}
