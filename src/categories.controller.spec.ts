import { Test, TestingModule } from '@nestjs/testing';
import { DBService } from './db.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Statement } from 'better-sqlite3';
import fs from "node:fs";

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let dbService: DBService;
  let getCategoryStatement: Statement;

  beforeEach(async () => {
    const test_module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [DBService, CategoriesService],
    }).compile();

    controller = test_module.get(CategoriesController);
    dbService = test_module.get(DBService);

    dbService.db.exec(fs.readFileSync("src/unit_test_init.sql", {encoding: "utf-8"}));
    getCategoryStatement = dbService.db.prepare("SELECT * FROM categories WHERE id = ?;");
  });

  describe(".getAll()", () => {
    it("should return all defined categories", () => {
      expect(controller.getAll()).toIncludeSameMembers([
        {
          id: 1,
          name: 'test category 1',
        },
        {
          id: 2,
          name: 'another test category',
        },
      ]);
    });
  });

  describe(".get()", () => {
    it("should return category if it exists", () => {
      expect(controller.get({ id: 1 })).toEqual({
        id: 1,
        name: 'test category 1',
      });

      expect(controller.get({ id: 2 })).toEqual({
        id: 2,
        name: 'another test category',
      });
    });

    it("should throw NotFoundException if category doesn't exist", () => {
      expect(() => controller.get({ id: 3 })).toThrow(NotFoundException);
    });
  });

  describe(".create()", () => {
    it("should create and return the category if it doesn't exist yet", () => {
      const name = 'a new category!';
      const createResult = controller.create({ name });

      expect(createResult).toEqual({
        id: expect.any(Number),
        name,
      });

      // verify with database
      expect(getCategoryStatement.get(createResult.id)).toEqual(createResult);
    });

    it("should throw ConflictException if the category already exists", () => {
      expect(() => controller.create({ name: 'test category 1' })).toThrow(ConflictException);
    });
  });

  describe(".delete()", () => {
    it("should delete the category if it exists and is not in use", () => {
      expect(() => controller.delete({ id: 1 })).not.toThrow();

      // verify with database
      expect(getCategoryStatement.get(1)).not.toEqual(expect.anything());
    });

    it("should throw NotFoundException if category doesn't exist", () => {
      expect(() => controller.delete({ id: 3 })).toThrow(NotFoundException);
    });

    it("should throw ConflictException if category is in use", () => {
      expect(() => controller.delete({ id: 2 })).toThrow(ConflictException);

      // verify that is still exists
      expect(getCategoryStatement.get(2)).toEqual(expect.anything());
    });
  });

  describe(".update()", () => {
    it("should update the category if it exists and the new name is unique", () => {
      const expected = { id: 1, name: "a category with its name changed" };
      expect(controller.update({ id: expected.id }, { name: expected.name })).toEqual(expected);

      // verify with database
      expect(getCategoryStatement.get(expected.id)).toEqual(expected);
    });

    it("should throw NotFoundException if category doesn't exist", () => {
      expect(() => controller.update({ id: 3 }, { name: "this should fail anyway" })).toThrow(NotFoundException);
    });

    it("should throw ConflictException if the category exists, but the new name is not unique", () => {
      expect(() => controller.update({ id: 1 }, { name: "another test category" })).toThrow(ConflictException); // this name is used by ID 2
    
      // verify that the change failed
      expect(getCategoryStatement.get(1)).toEqual({ id: 1, name: "test category 1" });
    });
  });

});
