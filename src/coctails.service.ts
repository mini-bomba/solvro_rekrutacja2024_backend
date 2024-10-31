import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DBService } from './db.service';
import { Statement, SqliteError } from 'better-sqlite3';
import { Coctail, CoctailContent } from './db_types';
import { CreateCoctailDTO, EditCoctailDTO, EditCoctailIngredientDTO, FilterCoctailsParams, InitialCoctailContentDTO } from './coctails.dto';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class CoctailsService {
  private readonly existsStatement: Statement;
  private readonly getOneStatement: Statement;
  private readonly getAllStatement: Statement;
  private readonly createStatement: Statement;
  private readonly deleteStatement: Statement;
  private readonly getIngredientsStatement: Statement;
  private readonly getIngredientStatement: Statement;
  private readonly setIngredientStatement: Statement;
  private readonly clearIngredientsStatement: Statement;
  private readonly removeIngredientStatement: Statement;
  private static readonly updateableFields: Record<string, string> = {
  // "API name": "DB name"
    "name": "name",
    "category_id": "category",
    "instructions": "instructions",
  }

  constructor(private readonly dbService: DBService) {
    this.existsStatement = dbService.db.prepare('SELECT 1 FROM coctails WHERE id = ? LIMIT 1;');
    this.getOneStatement = dbService.db.prepare('SELECT * FROM coctails WHERE id = ? LIMIT 1;');
    this.getAllStatement = dbService.db.prepare('SELECT * FROM coctails;');
    this.createStatement = dbService.db.prepare('INSERT INTO coctails (name, category, instructions) VALUES (@name, @category, @instructions) RETURNING *;')
    this.deleteStatement = dbService.db.prepare('DELETE FROM coctails WHERE id = ?;');
    this.getIngredientsStatement = dbService.db.prepare('SELECT ingredient_id, amount FROM coctail_contents WHERE coctail_id = ?;');
    this.getIngredientStatement = dbService.db.prepare('SELECT ingredient_id, amount FROM coctail_contents WHERE coctail_id = ? AND ingredient_id = ?;');
    this.setIngredientStatement = dbService.db.prepare('INSERT OR REPLACE INTO coctail_contents (coctail_id, ingredient_id, amount) VALUES (@coctail_id, @ingredient_id, @amount) RETURNING ingredient_id, amount;');
    this.clearIngredientsStatement = dbService.db.prepare('DELETE FROM coctail_contents WHERE coctail_id = ?;');
    this.removeIngredientStatement = dbService.db.prepare('DELETE FROM coctail_contents WHERE coctail_id = ? AND ingredient_id = ?;');
  }

  exists(id: number): boolean {
    return this.existsStatement.get(id) != undefined;
  }

  get(id: number): Coctail | undefined {
    return this.getOneStatement.get(id) as Coctail | undefined;
  }

  getAll(params: FilterCoctailsParams): Coctail[] {
    let statement: Statement;
    if (Object.keys(params).length === 0) {
      statement = this.getAllStatement;
    } else {
      let query: string;
      const where_clauses = [];
      const having_clauses = [];
      if (params.category_id != null) {
        where_clauses.push("coctails.category = @category_id");
      }
      if (params.ingredient_id != null) {
        having_clauses.push("SUM(CASE WHEN coctail_contents.ingredient_id = @ingredient_id THEN 1 ELSE 0 END) > 0");
      }
      if (params.contains_alcohol != null) {
        having_clauses.push(`SUM(CASE WHEN ingredients.contains_alcohol = TRUE THEN 1 ELSE 0 END) ${params.contains_alcohol ? '>' : '='} 0`);
      }

      if (having_clauses.length === 0) {
        if (where_clauses.length === 0) {
          query = "SELECT * FROM coctails;";
        } else {
          query = `SELECT * FROM coctails WHERE ${where_clauses.join(" AND ")};`;
        }
      } else {
        if (where_clauses.length === 0) {
          query = `
            SELECT coctails.* 
            FROM coctails 
            LEFT JOIN coctail_contents ON coctails.id = coctail_contents.coctail_id
            LEFT JOIN ingredients ON ingredients.id = coctail_contents.ingredient_id
            GROUP BY coctails.id
            HAVING ${having_clauses.join(" AND ")};
          `
        } else {
          query = `
            SELECT coctails.* 
            FROM coctails 
            LEFT JOIN coctail_contents ON coctails.id = coctail_contents.coctail_id
            LEFT JOIN ingredients ON ingredients.id = coctail_contents.ingredient_id
            WHERE ${where_clauses.join(" AND ")}
            GROUP BY coctails.id
            HAVING ${having_clauses.join(" AND ")};
          `
        }
      }
      new Logger(CoctailsService.name).log(query);
      statement = this.dbService.db.prepare(query);
    }
    return statement.all(instanceToPlain(params)) as Coctail[];
  }

  getIngredients(id: number): CoctailContent[] {
    return this.getIngredientsStatement.all(id) as CoctailContent[];
  }

  getIngredient(coctail_id: number, ingredient_id: number): CoctailContent | undefined {
    return this.getIngredientStatement.get(coctail_id, ingredient_id) as CoctailContent | undefined;
  }

  setIngredient(coctail_id: number, ingredient_id: number, obj: EditCoctailIngredientDTO): CoctailContent {
    return this.setIngredientStatement.get({
      coctail_id: coctail_id,
      ingredient_id: ingredient_id,
      ...obj,
    }) as CoctailContent;
  }

  removeIngredient(coctail_id: number, ingredient_id: number) {
    this.removeIngredientStatement.run(coctail_id, ingredient_id)
  }

  private batchSetIngredients(id: number, ingredients: InitialCoctailContentDTO[]) {
    for (const ingredient of ingredients) {
      if (ingredient.amount <= 0) {
        throw new BadRequestException("Ingredient amounts must be greater than 0");
      }
      try {
        this.setIngredientStatement.run({
          coctail_id: id,
          ingredient_id: ingredient.id,
          amount: ingredient.amount,
        });
      } catch (e) {
        if (!(e instanceof SqliteError)) throw e;

        switch (e.code) {
          case "SQLITE_CONSTRAINT_FOREIGNKEY":
            throw new NotFoundException(`Ingredient with id '${ingredient.id}' doesn't exist`);
          default:
            throw e;
        }
      }
    }
  }

  public readonly create: (obj: CreateCoctailDTO) => Coctail = this.dbService.db.transaction((obj: CreateCoctailDTO) => {
    let newCoctail: Coctail;
    // Create main entry
    try {
      newCoctail = this.createStatement.get({
        name: obj.name,
        category: obj.category_id,
        instructions: obj.instructions,
      }) as Coctail;
    } catch (e) {
      if (!(e instanceof SqliteError)) throw e;

      switch (e.code) {
        case "SQLITE_CONSTRAINT_FOREIGNKEY":
          throw new NotFoundException(`Category with id '${obj.category_id}' doesn't exist`);
        case "SQLITE_CONSTRAINT_UNIQUE":
          throw new ConflictException("Coctail with this name already exists");
        default:
          throw e;
      }
    }

    // Add ingredients if specified
    if (obj.ingredients != null) {
      this.batchSetIngredients(newCoctail.id, obj.ingredients);
    }
    
    return newCoctail;
  });

  // returns true if entry was deleted, false if there was nothing to delete
  delete(id: number): boolean {
    return this.deleteStatement.run(id).changes > 0;
  }

  public readonly update: (id: number, edits: EditCoctailDTO) => Coctail = this.dbService.db.transaction((id: number, edits: EditCoctailDTO) => {
    // batchSetIngredients can't differentiate between category and coctail missing, check for coctail existence explicitly
    if (!this.exists(id)) throw new NotFoundException(`Coctail with id '${id}' does not exist`);

    // Update ingredients, if specified
    if (edits.ingredients != null) {
      this.clearIngredientsStatement.run(id);
      this.batchSetIngredients(id, edits.ingredients);
    }

    // Update the rest
    const editQuerySnippets = [];
    const filteredEdits = {};

    // for each possible edit
    for (const [apiField, dbField] of Object.entries(CoctailsService.updateableFields)) {
      // if specified
      if (edits[apiField] !== undefined) {
        // add to query
        editQuerySnippets.push(`${dbField} = @${dbField}`)
        // and add to the parameters
        filteredEdits[dbField] = edits[apiField];
      }
    }
    
    let updatedCoctail: Coctail | undefined;
    if (editQuerySnippets.length > 0) {
      const statement = this.dbService.db.prepare(`UPDATE coctails SET ${editQuerySnippets.join(', ')} WHERE id = ? RETURNING *;`)
      try {
        updatedCoctail = statement.get(id, filteredEdits) as Coctail;
      } catch (e) {
        if (!(e instanceof SqliteError)) throw e;

        switch (e.code) {
          case "SQLITE_CONSTRAINT_FOREIGNKEY":
            throw new NotFoundException(`Category with id '${edits.category_id}' doesn't exist`);
          case "SQLITE_CONSTRAINT_UNIQUE":
            throw new ConflictException("Coctail with this name already exists");
          case "SQLITE_CONSTRAINT_NOTNULL":
            const field = e.message.split('.')[1];
            throw new BadRequestException(`'${field}' is a required field and cannot be set to null`);
          default:
            throw e;
        }
      }
    } else if (edits.ingredients == null) {
      throw new BadRequestException("No valid edits specified.")
    } else {
      updatedCoctail = this.get(id);
    }

    if (updatedCoctail == null) throw new NotFoundException(`Coctail with id '${id}' does not exist`);
    return updatedCoctail
  });
}
