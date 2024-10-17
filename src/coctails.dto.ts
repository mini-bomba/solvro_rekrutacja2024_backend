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
  name: string;
  category_id: number;
  instructions: string;
  ingredients?: InitialCoctailContentDTO[];
}

export class InitialCoctailContentDTO {
  id: number;
  amount: number;
}

export class EditCoctailDTO {
  name?: string;
  category_id?: number;
  instructions?: string;
  ingredients?: InitialCoctailContentDTO[];
}
