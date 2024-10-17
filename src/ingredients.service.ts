import { BadRequestException, Injectable } from '@nestjs/common';
import { DBService } from './db.service';
import { Database, Statement } from 'better-sqlite3';
import { Ingredient } from './db_types';
import { CreateIngredientDTO, EditIngredientDTO } from './ingredients.dto';

@Injectable()
export class IngredientsService {
  private readonly db: Database;
  private readonly existsStatement: Statement;
  private readonly getOneStatement: Statement;
  private readonly getAllStatement: Statement;
  private readonly createStatement: Statement;
  private readonly deleteStatement: Statement;
  private static readonly updateableFieldsAndTransforms: Record<string, (value: any) => any> = {
    name: (v) => v,
    description: (v) => v,
    contains_alcohol: (v) => {
      if (v == null) throw new BadRequestException("'contains_alcohol' is a required field and cannot be set to null");
      return v ? 1 : 0;
    },
    photo_url: (v) => v,
  }

  constructor(dbService: DBService) {
    this.db = dbService.db;
    this.existsStatement = this.db.prepare('SELECT 1 FROM ingredients WHERE id = ? LIMIT 1;');
    this.getOneStatement = this.db.prepare('SELECT * FROM ingredients WHERE id = ? LIMIT 1;');
    this.getAllStatement = this.db.prepare('SELECT * FROM ingredients;');
    this.createStatement = this.db.prepare(`
      INSERT INTO ingredients (name, description, contains_alcohol, photo_url)
      VALUES (@name, @description, @contains_alcohol, @photo_url) RETURNING *;
    `);
    this.deleteStatement = this.db.prepare('DELETE FROM ingredients WHERE id = ?;');
  }

  exists(id: number): boolean {
    return this.existsStatement.get(id) != undefined;
  }

  get(id: number): Ingredient | null {
    return this.transformDBObject(this.getOneStatement.get(id));
  }

  getAll(): Ingredient[] {
    return this.getAllStatement.all().map(this.transformDBObject.bind(this));
  }

  // returns the new entry
  create(obj: CreateIngredientDTO): Ingredient {
    return this.transformDBObject(this.createStatement.get({ 
      name: obj.name, 
      description: obj.description, 
      contains_alcohol: obj.contains_alcohol ? 1 : 0, 
      photo_url: obj.photo_url ?? null 
    }));
  }

  // returns true if entry was deleted, false if there was nothing to delete
  delete(id: number): boolean {
    return this.deleteStatement.run(id).changes > 0;
  }

  // returns the edited category if entry was updated, undefined/null if there was nothing to update
  update(id: number, edits: EditIngredientDTO): Ingredient | null {
    const editQuerySnippets = [];
    const filteredEdits = {};

    // for each possible edit
    for (const [field, transform] of Object.entries(IngredientsService.updateableFieldsAndTransforms)) {
      // if specified
      if (edits[field] !== undefined) {
        // add to query
        editQuerySnippets.push(`${field} = @${field}`)
        // and add to the parameters, applying a transform function if needed (for booleans)
        filteredEdits[field] = transform(edits[field]);
      }
    }

    if (editQuerySnippets.length == 0) throw new BadRequestException("No valid edits specified");

    const statement = this.db.prepare(`UPDATE ingredients SET ${editQuerySnippets.join(', ')} WHERE id = ? RETURNING *;`);
    return this.transformDBObject(statement.get(id, filteredEdits));
  }

  // transforms the object returned by sqlite into one expected by code
  // (aka. converts ints to booleans)
  private transformDBObject(obj: any | null): Ingredient | null {
    if (obj == null) return null;
    return {
      id: obj.id,
      name: obj.name,
      description: obj.description,
      contains_alcohol: !!obj.contains_alcohol,
      photo_url: obj.photo_url,
    }
  }
}
