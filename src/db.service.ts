import { Injectable } from '@nestjs/common';
import Sqlite3, { Database } from 'better-sqlite3';
import { readFileSync } from 'node:fs';

@Injectable()
export class DBService {
  private readonly _db: Database = new Sqlite3(':memory:');

  constructor() {
    this._db.exec(readFileSync('src/init.sql', { encoding: 'utf-8' }));
  }

  get db(): Database {
    return this._db;
  }
}
