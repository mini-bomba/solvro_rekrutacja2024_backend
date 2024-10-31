import { Test, TestingModule } from '@nestjs/testing';
import { DBService } from './db.service';
import fs from "node:fs";
import { CoctailsController } from './coctails.controller';
import { CoctailsService } from './coctails.service';
import { IngredientsService } from './ingredients.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Statement } from 'better-sqlite3';

describe('CoctailsController', () => {
  let controller: CoctailsController;
  let dbService: DBService;
  let getCoctailStatement: Statement;
  let getCoctailIngredientsStatement: Statement;

  beforeEach(async () => {
    const test_module: TestingModule = await Test.createTestingModule({
      controllers: [CoctailsController],
      providers: [DBService, CoctailsService, IngredientsService],
    }).compile();

    controller = test_module.get(CoctailsController);
    dbService = test_module.get(DBService);

    dbService.db.exec(fs.readFileSync("src/unit_test_init.sql", {encoding: "utf-8"}));
    getCoctailStatement = dbService.db.prepare("SELECT * FROM coctails WHERE id = ?;");
    getCoctailIngredientsStatement = dbService.db.prepare("SELECT * FROM coctail_contents WHERE coctail_id = ?;");
  });

  describe(".getAll()", () => {
    it("should return all defined coctails", () => {
      expect(controller.getAll()).toIncludeSameMembers([
        {
          id: 1,
          name: 'test coctail 1',
          category_id: 2,
          instructions: 'test, test, and test',
          ingredients: expect.toIncludeSameMembers([
            {
              id: 2,
              amount: 3,
            },
          ])
        },
        {
          id: 2,
          name: 'test coctail 2',
          category_id: 2,
          instructions: 'just add a bit of testing',
          ingredients: expect.toIncludeSameMembers([
          ])
        }
      ])
    });
  });

  describe(".get()", () => {
    it("should return coctail if it exists", () => {
      expect(controller.get({ id: 1 })).toEqual({
        id: 1,
        name: 'test coctail 1',
        category_id: 2,
        instructions: 'test, test, and test',
        ingredients: expect.toIncludeSameMembers([
          {
            id: 2,
            amount: 3,
          }
        ])
      });
    });
    it("should throw NotFoundException if coctail doesn't exist", () => {
      expect(() => controller.get({id: 3})).toThrow(NotFoundException);
    });
  });

  describe(".create()", () => {
    it("should create and return the coctail if it doesn't exist yet and all references are valid (no ingredients)", () => {
      const new_obj = {
        name: "a new coctail",
        category_id: 1,
        instructions: "just add water",
      }

      const create_result = controller.create(new_obj);

      expect(create_result).toEqual({
        id: expect.any(Number),
        ingredients: [],
        ...new_obj,
      });

      // verify in db
      expect(getCoctailStatement.get(create_result.id)).toEqual({
        id: create_result.id,
        name: new_obj.name,
        category: new_obj.category_id,
        instructions: new_obj.instructions,
      });
      expect(getCoctailIngredientsStatement.all(create_result.id)).toHaveLength(0);
    });
    it("should create and return the coctail if it doesn't exist yet and all references are valid (with ingredients)", () => {
      const new_obj = {
        name: "a newer coctail",
        category_id: 2,
        instructions: "brew some tea or smth idk",
        ingredients: [
          {
            id: 1,
            amount: 2,
          },
          {
            id: 2,
            amount: 0.5,
          }
        ]
      }

      const create_result = controller.create(new_obj);

      expect(create_result).toEqual({
        id: expect.any(Number),
        ...new_obj,
      });

      // verify in db
      expect(getCoctailStatement.get(create_result.id)).toEqual({
        id: create_result.id,
        name: new_obj.name,
        category: new_obj.category_id,
        instructions: new_obj.instructions,
      });
      expect(getCoctailIngredientsStatement.all(create_result.id)).toIncludeSameMembers([
        {
          coctail_id: create_result.id,
          ingredient_id: 1,
          amount: 2,
        },
        {
          coctail_id: create_result.id,
          ingredient_id: 2,
          amount: 0.5,
        },
      ]);
    });

    it("should throw ConflictException if the coctail already exists", () => {
      expect(() => controller.create({
        name: 'test coctail 1',
        category_id: 2,
        instructions: "idk",
      })).toThrow(ConflictException);
    });
    it("should throw NotFoundException if the referenced category does not exist", () => {
      expect(() => controller.create({
        name: 'test coctail 3',
        category_id: 2137,
        instructions: "idk",
      })).toThrow(NotFoundException);
    });
    it("should throw NotFoundException if the referenced ingredient does not exist", () => {
      expect(() => controller.create({
        name: 'test coctail 4',
        category_id: 2,
        instructions: "idk",
        ingredients: [
          {
            id: 2137,
            amount: 21.37,
          }
        ]
      })).toThrow(NotFoundException);
    });
    it("should throw BadRequestException if a defined ingredient has an amount of 0", () => {
      expect(() => controller.create({
        name: 'test coctail 5',
        category_id: 2,
        instructions: "idk",
        ingredients: [
          {
            id: 2,
            amount: 0,
          }
        ]
      })).toThrow(BadRequestException);
    });
    it("should throw BadRequestException if a defined ingredient has a negative amount", () => {
      expect(() => controller.create({
        name: 'test coctail 6',
        category_id: 2,
        instructions: "idk",
        ingredients: [
          {
            id: 2,
            amount: -21.37,
          }
        ]
      })).toThrow(BadRequestException);
    });
  });

  describe(".delete()", () => {
    it("should delete the coctail if it exists (empty ingredients list)", () => {
      expect(() => controller.delete({ id: 2 })).not.toThrow();

      // verify
      expect(getCoctailStatement.get(2)).not.toEqual(expect.anything());
      expect(getCoctailIngredientsStatement.all(2)).toHaveLength(0);
    });
    it("should delete the coctail if it exists (with ingredients, should also remove entries in the coctail_contents table)", () => {
      expect(() => controller.delete({ id: 1 })).not.toThrow();

      // verify
      expect(getCoctailStatement.get(1)).not.toEqual(expect.anything());
      expect(getCoctailIngredientsStatement.all(1)).toHaveLength(0);
    });

    it("should throw NotFoundException if coctail doesn't exist", () => {
      expect(() => controller.delete({ id: 3 })).toThrow(NotFoundException);
    });
  });

  describe(".update()", () => {
    it("should update the coctail name if it exists and the new name is unique", () => {
      const expected = {
        id: 1,
        name: 'an updated nanme',
        category_id: 2,
        instructions: 'test, test, and test',
        ingredients: expect.toIncludeSameMembers([
          {
            id: 2,
            amount: 3,
          },
        ])
      };

      expect(controller.update({ id: 1 }, { name: expected.name })).toEqual(expected);

      // verify in db
      expect(getCoctailStatement.get(1)).toEqual({
        id: expected.id,
        name: expected.name,
        category: expected.category_id,
        instructions: expected.instructions,
      });
      expect(getCoctailIngredientsStatement.all(1)).toIncludeSameMembers([
        {
          coctail_id: 1,
          ingredient_id: 2,
          amount: 3,
        },
      ]);
    });

    it("should update the coctail category if it exists", () => {
      const expected = {
        id: 1,
        name: 'test coctail 1',
        category_id: 1,
        instructions: 'test, test, and test',
        ingredients: expect.toIncludeSameMembers([
          {
            id: 2,
            amount: 3,
          },
        ])
      };

      expect(controller.update({ id: 1 }, { category_id: expected.category_id })).toEqual(expected);

      // verify in db
      expect(getCoctailStatement.get(1)).toEqual({
        id: expected.id,
        name: expected.name,
        category: expected.category_id,
        instructions: expected.instructions,
      });
      expect(getCoctailIngredientsStatement.all(1)).toIncludeSameMembers([
        {
          coctail_id: 1,
          ingredient_id: 2,
          amount: 3,
        },
      ]);
    });

    it("should update the coctail instructions", () => {
      const expected = {
        id: 1,
        name: 'test coctail 1',
        category_id: 2,
        instructions: 'new instructions',
        ingredients: expect.toIncludeSameMembers([
          {
            id: 2,
            amount: 3,
          },
        ])
      };

      expect(controller.update({ id: 1 }, { instructions: expected.instructions })).toEqual(expected);

      // verify in db
      expect(getCoctailStatement.get(1)).toEqual({
        id: expected.id,
        name: expected.name,
        category: expected.category_id,
        instructions: expected.instructions,
      });
      expect(getCoctailIngredientsStatement.all(1)).toIncludeSameMembers([
        {
          coctail_id: 1,
          ingredient_id: 2,
          amount: 3,
        },
      ]);
    });

    it("should replace the coctail ingredients list", () => {
      const expected = {
        id: 1,
        name: 'test coctail 1',
        category_id: 2,
        instructions: 'test, test, and test',
        ingredients: [
          {
            id: 1,
            amount: 21.37,
          },
        ],
      };

      const edit_result = controller.update({ id: 1 }, { ingredients: expected.ingredients });
      expected.ingredients = expect.toIncludeSameMembers(expected.ingredients);
      expect(edit_result).toEqual(expected);

      // verify in db
      expect(getCoctailStatement.get(1)).toEqual({
        id: expected.id,
        name: expected.name,
        category: expected.category_id,
        instructions: expected.instructions,
      });
      expect(getCoctailIngredientsStatement.all(1)).toIncludeSameMembers([
        {
          coctail_id: 1,
          ingredient_id: 1,
          amount: 21.37,
        },
      ]);
    });

    it("should reset coctail ingredients list", () => {
      const expected = {
        id: 1,
        name: 'test coctail 1',
        category_id: 2,
        instructions: 'test, test, and test',
        ingredients: [
        ],
      };

      const edit_result = controller.update({ id: 1 }, { ingredients: expected.ingredients });
      expected.ingredients = expect.toIncludeSameMembers(expected.ingredients);
      expect(edit_result).toEqual(expected);

      // verify in db
      expect(getCoctailStatement.get(1)).toEqual({
        id: expected.id,
        name: expected.name,
        category: expected.category_id,
        instructions: expected.instructions,
      });
      expect(getCoctailIngredientsStatement.all(1)).toIncludeSameMembers([
      ]);
    });

    it("should be able to do all possible edits at once", () => {
      const expected = {
        id: 1,
        name: 'test coctail 1 [NEW!]',
        category_id: 1,
        instructions: 'a new and improved formula',
        ingredients: [
          {
            id: 1,
            amount: 2.137,
          }
        ],
      };

      const edit_result = controller.update({ id: 1 }, { 
        name: expected.name,
        category_id: expected.category_id,
        instructions: expected.instructions,
        ingredients: expected.ingredients,
      });
      expected.ingredients = expect.toIncludeSameMembers(expected.ingredients);
      expect(edit_result).toEqual(expected);

      // verify in db
      expect(getCoctailStatement.get(1)).toEqual({
        id: expected.id,
        name: expected.name,
        category: expected.category_id,
        instructions: expected.instructions,
      });
      expect(getCoctailIngredientsStatement.all(1)).toIncludeSameMembers([
        {
          coctail_id: 1,
          ingredient_id: 1,
          amount: 2.137,
        }
      ]);
      
    });

    const id1_expected_coctail = {
      id: 1,
      name: 'test coctail 1',
      category: 2,
      instructions: 'test, test, and test',
    }
    const id1_expected_ingredients = [
      {
        coctail_id: 1,
        ingredient_id: 2,
        amount: 3,
      },
    ];

    it("should throw NotFoundException if coctail doesn't exist", () => {
      expect(() => controller.update({id: 3}, {name: "test!"})).toThrow(NotFoundException);
    });
    it("should throw BadRequestException when trying to set properties to null", () => {
      
      for (const prop of ["name", "category_id", "instructions", "ingredients"]) {
        expect(() => controller.update({id:1}, {[prop]: null})).toThrow(BadRequestException);

        // verify no changes were made
        expect(getCoctailStatement.get(1)).toEqual(id1_expected_coctail);
        expect(getCoctailIngredientsStatement.all(1)).toIncludeSameMembers(id1_expected_ingredients);
      }
    });
    it("should throw BadRequestException when the edits object is empty", () => {
      expect(() => controller.update({id:1}, {})).toThrow(BadRequestException);

      // verify no changes were made
      expect(getCoctailStatement.get(1)).toEqual(id1_expected_coctail);
      expect(getCoctailIngredientsStatement.all(1)).toIncludeSameMembers(id1_expected_ingredients);
    });
    it("should throw NotFoundException when referenced category doesn't exist", () => {
      expect(() => controller.update({id:1}, {category_id: 2137})).toThrow(NotFoundException);

      // verify no changes were made
      expect(getCoctailStatement.get(1)).toEqual(id1_expected_coctail);
      expect(getCoctailIngredientsStatement.all(1)).toIncludeSameMembers(id1_expected_ingredients);
    });
    it("should throw NotFoundException when referenced ingredient doesn't exist", () => {
      expect(() => controller.update({id:1}, {ingredients: [{id: 2137, amount: 1}]})).toThrow(NotFoundException);

      // verify no changes were made
      expect(getCoctailStatement.get(1)).toEqual(id1_expected_coctail);
      expect(getCoctailIngredientsStatement.all(1)).toIncludeSameMembers(id1_expected_ingredients);
    });
    it("should throw BadRequestException when trying to set ingredient amount to 0", () => {
      expect(() => controller.update({id:1}, {ingredients: [{id: 1, amount: 0}]})).toThrow(BadRequestException);

      // verify no changes were made
      expect(getCoctailStatement.get(1)).toEqual(id1_expected_coctail);
      expect(getCoctailIngredientsStatement.all(1)).toIncludeSameMembers(id1_expected_ingredients);
    });
    it("should throw BadRequestException when trying to set ingredient amount to a negative number", () => {
      expect(() => controller.update({id:1}, {ingredients: [{id: 1, amount: -2137}]})).toThrow(BadRequestException);

      // verify no changes were made
      expect(getCoctailStatement.get(1)).toEqual(id1_expected_coctail);
      expect(getCoctailIngredientsStatement.all(1)).toIncludeSameMembers(id1_expected_ingredients);
    });
    it("should throw ConflictException when trying to set the name to one already used by another coctail", () => {
      expect(() => controller.update({id:1}, {name: 'test coctail 2'})).toThrow(ConflictException);

      // verify no changes were made
      expect(getCoctailStatement.get(1)).toEqual(id1_expected_coctail);
      expect(getCoctailIngredientsStatement.all(1)).toIncludeSameMembers(id1_expected_ingredients);
    });
  });

  describe(".getIngredients()", () => {
    it("should list coctail's ingredients if it exists", () => {
      expect(controller.getIngredients({id: 1})).toIncludeSameMembers([
        {
          id: 2,
          amount: 3,
        }
      ]);

      expect(controller.getIngredients({id: 2})).toIncludeSameMembers([]);
    });
    it("should throw NotFoundException if coctail doesn't exist", () => {
      expect(() => controller.getIngredients({id: 3})).toThrow(NotFoundException);
    });
  });

  describe(".getIngredient()", () => {
    it("should return coctail ingredient if the coctail and ingredient are defined", () => {
      expect(controller.getIngredient({ coctail_id: 1, ingredient_id: 2 })).toEqual({
        id: 2,
        amount: 3,
      });
    });
    it("should return coctail ingredient even if it's not used in the coctail", () => {
      expect(controller.getIngredient({ coctail_id: 2, ingredient_id: 2 })).toEqual({
        id: 2,
        amount: 0,
      });

      expect(controller.getIngredient({ coctail_id: 1, ingredient_id: 1 })).toEqual({
        id: 1,
        amount: 0,
      });

      expect(controller.getIngredient({ coctail_id: 2, ingredient_id: 1 })).toEqual({
        id: 1,
        amount: 0,
      });
    });

    it("should throw NotFoundException if coctail doesn't exist", () => {
      expect(() => controller.getIngredient({ coctail_id: 2137, ingredient_id: 1 })).toThrow(NotFoundException)
    });
    it("should throw NotFoundException if ingredient doesn't exist", () => {
      expect(() => controller.getIngredient({ coctail_id: 2, ingredient_id: 2137 })).toThrow(NotFoundException)
    });
  });

  describe(".setIngredient()", () => {
    it("should update ingredient usage if it's already used in the coctail", () => {
      expect(controller.setIngredient({ coctail_id: 1, ingredient_id: 2 }, { amount: 21.37 })).toEqual({
        id: 2,
        amount: 21.37,
      });
      
      // verify in db
      expect(getCoctailIngredientsStatement.all(1)).toIncludeSameMembers([
        {
          coctail_id: 1,
          ingredient_id: 2,
          amount: 21.37,
        },
      ]);
    });
    it("should add ingredient if it's not used in the coctail", () => {
      expect(controller.setIngredient({ coctail_id: 1, ingredient_id: 1 }, { amount: 21.37 })).toEqual({
        id: 1,
        amount: 21.37,
      });
      
      // verify in db
      expect(getCoctailIngredientsStatement.all(1)).toIncludeSameMembers([
        {
          coctail_id: 1,
          ingredient_id: 1,
          amount: 21.37,
        },
        {
          coctail_id: 1,
          ingredient_id: 2,
          amount: 3,
        },
      ]);
    });
    it("should remove ingredient if amount is set to 0", () => {
      expect(controller.setIngredient({ coctail_id: 1, ingredient_id: 2 }, { amount: 0 })).toEqual({
        id: 2,
        amount: 0,
      });
      
      // verify in db
      expect(getCoctailIngredientsStatement.all(1)).toIncludeSameMembers([]);
    });

    it("should throw NotFoundException if coctail doesn't exist", () => {
      expect(() => controller.setIngredient({ coctail_id: 2137, ingredient_id: 2 }, { amount: 2137 })).toThrow(NotFoundException);
    });
    it("should throw NotFoundException if ingredient doesn't exist", () => {
      expect(() => controller.setIngredient({ coctail_id: 2, ingredient_id: 2137 }, { amount: 2137 })).toThrow(NotFoundException);

      // verify in db
      expect(getCoctailIngredientsStatement.all(2)).toIncludeSameMembers([])
    });
    it("should throw if amount is negative", () => {
      expect(() => controller.setIngredient({ coctail_id: 2, ingredient_id: 2}, { amount: -2137 })).toThrow();
    });
  });

  describe(".removeIngredient()", () => {
    it("should remove ingredient if coctail and ingredient are defined", () => {
      expect(() => controller.removeIngredient({ coctail_id: 1, ingredient_id: 2 })).not.toThrow();

      // verify in db
      expect(getCoctailIngredientsStatement.all(1)).toHaveLength(0);
    });
    it("should not throw even if the coctail does not contain the ingredient", () => {
      expect(() => controller.removeIngredient({ coctail_id: 2, ingredient_id: 2 })).not.toThrow();
    });

    it("should throw NotFoundException if coctail doesn't exist", () => {
      expect(() => controller.removeIngredient({ coctail_id: 2137, ingredient_id: 2})).toThrow(NotFoundException);
    });
    it("should throw NotFoundException if ingredient doesn't exist", () => {
      expect(() => controller.removeIngredient({ coctail_id: 2, ingredient_id: 2137})).toThrow(NotFoundException);
    });
  });
});
