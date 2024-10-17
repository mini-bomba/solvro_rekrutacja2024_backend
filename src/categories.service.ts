import { Injectable } from '@nestjs/common';
import { DBService } from './db.service';
import { Statement } from 'better-sqlite3';
import { Category } from './db_types';
import { CreateCategoryDTO } from './categories.dto';

@Injectable()
export class CategoriesService {
  private readonly existsStatement: Statement;
  private readonly getOneStatement: Statement;
  private readonly getAllStatement: Statement;
  private readonly createStatement: Statement;
  private readonly deleteStatement: Statement;
  private readonly updateStatement: Statement;

  constructor(dbService: DBService) {
    this.existsStatement = dbService.db.prepare('SELECT 1 FROM categories WHERE id = ? LIMIT 1;');
    this.getOneStatement = dbService.db.prepare('SELECT * FROM categories WHERE id = ? LIMIT 1;');
    this.getAllStatement = dbService.db.prepare('SELECT * FROM categories;');
    this.createStatement = dbService.db.prepare('INSERT INTO categories (name) VALUES (@name) RETURNING *;');
    this.deleteStatement = dbService.db.prepare('DELETE FROM categories WHERE id = ?;');
    this.updateStatement = dbService.db.prepare('UPDATE categories SET name = @name WHERE id = ? RETURNING *;');
  }

  exists(id: number): boolean {
    return this.existsStatement.get(id) != undefined;
  }

  get(id: number): Category | undefined {
    return this.getOneStatement.get(id) as Category | undefined;
  }

  getAll(): Category[] {
    return this.getAllStatement.all() as Category[];
  }

  // returns the new entry
  create(obj: CreateCategoryDTO): Category {
    return this.createStatement.get(obj) as Category;
  }

  // returns true if entry was deleted, false if there was nothing to delete
  delete(id: number): boolean {
    return this.deleteStatement.run(id).changes > 0;
  }

  // returns the edited category if entry was updated, undefined/null if there was nothing to update
  update(id: number, edits: CreateCategoryDTO): Category | undefined {
    return this.updateStatement.get(id, edits) as Category | undefined;
  }
}
