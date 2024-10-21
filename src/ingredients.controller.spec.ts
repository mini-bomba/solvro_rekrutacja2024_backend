import { Test, TestingModule } from '@nestjs/testing';
import { DBService } from './db.service';
import fs from "node:fs";
import { IngredientsService } from './ingredients.service';
import { IngredientsController } from './ingredients.controller';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Statement } from 'better-sqlite3';
import { EditIngredientDTO } from './ingredients.dto';

describe('IngredientsController', () => {
  let controller: IngredientsController;
  let dbService: DBService;
  let getIngredientsStatement: Statement;

  beforeEach(async () => {
    const test_module: TestingModule = await Test.createTestingModule({
      controllers: [IngredientsController],
      providers: [DBService, IngredientsService],
    }).compile();

    controller = test_module.get(IngredientsController);
    dbService = test_module.get(DBService);

    dbService.db.exec(fs.readFileSync("src/unit_test_init.sql", {encoding: "utf-8"}));
    getIngredientsStatement = dbService.db.prepare("SELECT * FROM ingredients WHERE id = ?;");
  });

  describe(".getAll()", () => {
    it("should return all defined ingredients", () => {
      expect(controller.getAll()).toIncludeSameMembers([
        {
          id: 1,
          name: 'test ingredient 1',
          description: 'description!!!!',
          contains_alcohol: false,
          photo_url: null,
        },
        {
          id: 2,
          name: 'a second ingredient',
          description: 'this one has alcohol',
          contains_alcohol: true,
          photo_url: 'https://minibomba.pro/icons/mini_bomba.png',
        },
      ]);
    });
  });

  describe(".get()", () => {
    it("should return ingredient if it exists", () => {
      expect(controller.get({ id: 1 })).toEqual({
        id: 1,
        name: 'test ingredient 1',
        description: 'description!!!!',
        contains_alcohol: false,
        photo_url: null,
      });

      expect(controller.get({ id: 2 })).toEqual({
        id: 2,
        name: 'a second ingredient',
        description: 'this one has alcohol',
        contains_alcohol: true,
        photo_url: 'https://minibomba.pro/icons/mini_bomba.png',
      });
    });

    it("should throw NotFoundException if ingredient doesn't exist", () => {
      expect(() => controller.get({ id: 3 })).toThrow(NotFoundException);
    });
  });

  describe(".create()", () => {
    it("should create and return the ingredient if it doesn't exist yet (no photo url)", () => {
      const new_obj = {
        name: 'a new one!',
        description: 'new ingredient, alcohol-free',
        contains_alcohol: false,
      }
      const createResult = controller.create(new_obj);
      
      expect(createResult).toEqual({
        id: expect.any(Number),
        photo_url: null,
        ...new_obj,
      });
      
      // verify in db
      expect(getIngredientsStatement.get(createResult.id)).toEqual({
        id: createResult.id,
        name: new_obj.name,
        description: new_obj.description,
        contains_alcohol: 0,
        photo_url: null,
      });
    });
    it("should create and return the ingredient if it doesn't exist yet (null photo url)", () => {
      const new_obj = {
        name: 'a new one! #2',
        description: 'newer ingredient, with alcohol',
        contains_alcohol: true,
        photo_url: null,
      }
      const createResult = controller.create(new_obj);
      
      expect(createResult).toEqual({
        id: expect.any(Number),
        ...new_obj,
      });
      
      // verify in db
      expect(getIngredientsStatement.get(createResult.id)).toEqual({
        id: createResult.id,
        name: new_obj.name,
        description: new_obj.description,
        contains_alcohol: 1,
        photo_url: null,
      });
    });
    it("should create and return the ingredient if it doesn't exist yet (with photo url)", () => {
      const new_obj = {
        name: 'a new one! #3',
        description: 'newer ingredient, with alcohol and a photo',
        contains_alcohol: true,
        photo_url: 'url',
      }
      const createResult = controller.create(new_obj);
      
      expect(createResult).toEqual({
        id: expect.any(Number),
        ...new_obj,
      });
      
      // verify in db
      expect(getIngredientsStatement.get(createResult.id)).toEqual({
        id: createResult.id,
        name: new_obj.name,
        description: new_obj.description,
        contains_alcohol: 1,
        photo_url: new_obj.photo_url,
      });
    });

    it("should throw ConflictException if the ingredient already exists", () => {
      expect(() => controller.create({
        name: 'test ingredient 1',
        description: 'a',
        contains_alcohol: true,
      })).toThrow(ConflictException);
    });
  });

  describe(".delete()", () => {
    it("should delete the ingredient if it exists", () => {
      expect(() => controller.delete({ id: 1 })).not.toThrow();

      // verify in db
      expect(getIngredientsStatement.get(1)).not.toEqual(expect.anything());
    });

    it("should throw NotFoundException if ingredient doesn't exist", () => {
      expect(() => controller.delete({ id: 3 })).toThrow(NotFoundException);
    });
    it("should throw ConflictException if ingredient is in use", () => {
      expect(() => controller.delete({ id: 2 })).toThrow(ConflictException);

      // verify that it didn't get deleted
      expect(getIngredientsStatement.get(2)).toEqual(expect.anything());
    });
  });

  describe(".update()", () => {
    it("should update the ingredient name if it exists and the new name is unique", () => {
      const expected = {
        id: 1,
        name: 'edited ingredient 1',
        description: 'description!!!!',
        contains_alcohol: false as boolean | number,
        photo_url: null,
      };

      expect(controller.update({ id: 1 }, { name: expected.name })).toEqual(expected);

      // verify in db
      expected.contains_alcohol = 0;
      expect(getIngredientsStatement.get(1)).toEqual(expected);
    });
    it("should update the ingredient description", () => {
      const expected = {
        id: 1,
        name: 'test ingredient 1',
        description: 'edited description!!!!',
        contains_alcohol: false as boolean | number,
        photo_url: null,
      };

      expect(controller.update({ id: 1 }, { description: expected.description })).toEqual(expected);

      // verify in db
      expected.contains_alcohol = 0;
      expect(getIngredientsStatement.get(1)).toEqual(expected);
    });
    it("should update the ingredient alcohol flag", () => {
      const expected = {
        id: 1,
        name: 'test ingredient 1',
        description: 'description!!!!',
        contains_alcohol: true as boolean | number,
        photo_url: null,
      };

      expect(controller.update({ id: 1 }, { contains_alcohol: expected.contains_alcohol as boolean })).toEqual(expected);

      // verify in db
      expected.contains_alcohol = 1;
      expect(getIngredientsStatement.get(1)).toEqual(expected);
    });
    it("should update the ingredient photo url", () => {
      const expected = {
        id: 1,
        name: 'test ingredient 1',
        description: 'description!!!!',
        contains_alcohol: false as boolean | number,
        photo_url: "new url",
      };

      expect(controller.update({ id: 1 }, { photo_url: expected.photo_url })).toEqual(expected);

      // verify in db
      expected.contains_alcohol = 0;
      expect(getIngredientsStatement.get(1)).toEqual(expected);
    });
    it("should remove the ingredient photo url", () => {
      const expected = {
        id: 2,
        name: 'a second ingredient',
        description: 'this one has alcohol',
        contains_alcohol: true as boolean | number,
        photo_url: null,
      };

      expect(controller.update({ id: 2 }, { photo_url: expected.photo_url })).toEqual(expected);

      // verify in db
      expected.contains_alcohol = 1;
      expect(getIngredientsStatement.get(2)).toEqual(expected);

    });
    it("should be able to do all possible edits at once", () => {
      const expected = {
        id: 1,
        name: 'edited ingredient 1',
        description: 'edited description!!!!',
        contains_alcohol: true as boolean | number,
        photo_url: "new url",
      };

      expect(controller.update({ id: 1 }, expected as EditIngredientDTO)).toEqual(expected);

      // verify in db
      expected.contains_alcohol = 1;
      expect(getIngredientsStatement.get(1)).toEqual(expected);
    });

    it("should throw NotFoundException if ingredient doesn't exist", () => {
      expect(() => controller.update({ id: 3 }, { name: 'a' })).toThrow(NotFoundException);
    });
    it("should throw BadRequestException when trying to set required properties to null", () => {
      const expected = {
        id: 1,
        name: 'test ingredient 1',
        description: 'description!!!!',
        contains_alcohol: 0,
        photo_url: null,
      };

      for (const prop of ['name', 'description', 'contains_alcohol']) {
        const edits = {
          [prop]:  null,
        };
        expect(() => controller.update({ id: 1 }, edits)).toThrow(BadRequestException);

        // verify that the db was not edited
        expect(getIngredientsStatement.get(1)).toEqual(expected);
      }
    });
    it("should throw BadRequestException when the edits object is empty", () => {
      expect(() => controller.update({ id: 1 }, {})).toThrow(BadRequestException);

      // verify that the db was not edited
      expect(getIngredientsStatement.get(1)).toEqual({
        id: 1,
        name: 'test ingredient 1',
        description: 'description!!!!',
        contains_alcohol: 0,
        photo_url: null,
      });
    });
    it("should throw ConflictException when trying to set the name to one already used by another ingredient", () => {
      expect(() => controller.update({ id: 1 }, { name: "a second ingredient" })).toThrow(ConflictException);

      // verify that the db was not edited
      expect(getIngredientsStatement.get(1)).toEqual({
        id: 1,
        name: 'test ingredient 1',
        description: 'description!!!!',
        contains_alcohol: 0,
        photo_url: null,
      });

    });
  });
});
