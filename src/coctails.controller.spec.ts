import { Test, TestingModule } from '@nestjs/testing';
import { DBService } from './db.service';
import fs from "node:fs";
import { CoctailsController } from './coctails.controller';
import { CoctailsService } from './coctails.service';
import { IngredientsService } from './ingredients.service';

describe('CoctailsController', () => {
  let controller: CoctailsController;
  let dbService: DBService;

  beforeEach(async () => {
    const test_module: TestingModule = await Test.createTestingModule({
      controllers: [CoctailsController],
      providers: [DBService, CoctailsService, IngredientsService],
    }).compile();

    controller = test_module.get(CoctailsController);
    dbService = test_module.get(DBService);

    dbService.db.exec(fs.readFileSync("src/unit_test_init.sql", {encoding: "utf-8"}));
  });

  describe(".getAll()", () => {
    it.todo("should return all defined coctails");
  });

  describe(".get()", () => {
    it.todo("should return coctail if it exists");
    it.todo("should throw NotFoundException if coctail doesn't exist");
  });

  describe(".create()", () => {
    it.todo("should create and return the coctail if it doesn't exist yet and all references are valid (no ingredients)");
    it.todo("should create and return the coctail if it doesn't exist yet and all references are valid (with ingredients)");

    it.todo("should throw ConflictException if the coctail already exists");
    it.todo("should throw NotFoundException if the referenced category does not exist");
    it.todo("should throw NotFoundException if the referenced ingredient does not exist");
    it.todo("should throw BadRequestException if a defined ingredient has an amount of 0");
    it.todo("should throw BadRequestException if a defined ingredient has a negative amount");
  });

  describe(".delete()", () => {
    it.todo("should delete the coctail if it exists (empty ingredients list)");
    it.todo("should delete the coctail if it exists (with ingredients, should also remove entries in the coctail_contents table)");

    it.todo("should throw NotFoundException if coctail doesn't exist");
  });

  describe(".update()", () => {
    it.todo("should update the coctail name if it exists and the new name is unique");
    it.todo("should update the coctail category if it exists");
    it.todo("should update the coctail instructions");
    it.todo("should replace the coctail ingredients list");
    it.todo("should reset coctail ingredients list");
    it.todo("should be able to do all possible edits at once");

    it.todo("should throw NotFoundException if coctail doesn't exist");
    it.todo("should throw BadRequestException when trying to set properties to null");
    it.todo("should throw BadRequestException when the edits object is empty");
    it.todo("should throw NotFoundException when referenced category doesn't exist");
    it.todo("should throw NotFoundException when referenced ingredient doesn't exist");
    it.todo("should throw BadRequestException when trying to set ingredient amount to 0");
    it.todo("should throw BadRequestException when trying to set ingredient amount to a negative number");
    it.todo("should throw ConflictException when trying to set the name to one already used by another coctail");
  });

  describe(".getIngredients()", () => {
    it.todo("should list coctail's ingredients if it exists");
    it.todo("should throw NotFoundException if coctail doesn't exist");
  });

  describe(".getIngredient()", () => {
    it.todo("should return coctail ingredient if the coctail and ingredient are defined");
    it.todo("should return coctail ingredient even if it's not used in the coctail");

    it.todo("should throw NotFoundException if coctail doesn't exist");
    it.todo("should throw NotFoundException if ingredient doesn't exist");
  });

  describe(".setIngredient()", () => {
    it.todo("should update ingredient usage if it's already used in the coctail");
    it.todo("should add ingredient if it's not used in the coctail");
    it.todo("should remove ingredient if amount is set to 0");
    it.todo("should return coctail ingredient even if it's not used in the coctail");

    it.todo("should throw NotFoundException if coctail doesn't exist");
    it.todo("should throw NotFoundException if ingredient doesn't exist");
    it.todo("should throw if amount is negative");
  });

  describe(".removeIngredient()", () => {
    it.todo("should remove ingredient if coctail and ingredient are defined");
    it.todo("should not throw even if the coctail does not contain the ingredient");

    it.todo("should throw NotFoundException if coctail doesn't exist");
    it.todo("should throw NotFoundException if ingredient doesn't exist");
  });
});
