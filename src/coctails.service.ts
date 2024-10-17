import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DBService } from './db.service';
import { Statement, SqliteError } from 'better-sqlite3';
import { Coctail, CoctailContent } from './db_types';
import { CreateCoctailDTO, EditCoctailDTO, InitialCoctailContentDTO } from './coctails.dto';

@Injectable()
export class CoctailsService {
  private readonly existsStatement: Statement;
  private readonly getOneStatement: Statement;
  private readonly getAllStatement: Statement;
  private readonly createStatement: Statement;
  private readonly deleteStatement: Statement;
  private readonly getIngredientsStatement: Statement;
  private readonly setIngredientStatement: Statement;
  private readonly clearIngredientsStatement: Statement;
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
    this.setIngredientStatement = dbService.db.prepare('INSERT OR REPLACE INTO coctail_contents (coctail_id, ingredient_id, amount) VALUES (@coctail_id, @ingredient_id, @amount);');
    this.clearIngredientsStatement = dbService.db.prepare('DELETE FROM coctail_contents WHERE coctail_id = ?;');
  }

  exists(id: number): boolean {
    return this.existsStatement.get(id) != undefined;
  }

  get(id: number): Coctail | undefined {
    return this.getOneStatement.get(id) as Coctail | undefined;
  }

  getAll(): Coctail[] {
    return this.getAllStatement.all() as Coctail[];
  }

  getIngredients(id: number): CoctailContent[] {
    return this.getIngredientsStatement.all(id) as CoctailContent[];
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
