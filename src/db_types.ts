export interface Coctail {
  id: number;
  name: string;
  category: number;
  instructions: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Ingredient {
  id: number;
  name: string;
  description: string;
  contains_alcohol: boolean;
  photo_url: string | null;
}

export interface CoctailContent {
  ingredient_id: number;
  amount: number;
}
