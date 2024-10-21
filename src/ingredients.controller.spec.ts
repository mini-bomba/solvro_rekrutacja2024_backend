import { Test, TestingModule } from '@nestjs/testing';
import { DBService } from './db.service';
import fs from "node:fs";
import { IngredientsService } from './ingredients.service';
import { IngredientsController } from './ingredients.controller';

describe('CoctailsController', () => {
  let controller: IngredientsController;
  let dbService: DBService;

  beforeEach(async () => {
    const test_module: TestingModule = await Test.createTestingModule({
      controllers: [IngredientsController],
      providers: [DBService, IngredientsService],
    }).compile();

    controller = test_module.get(IngredientsController);
    dbService = test_module.get(DBService);

    dbService.db.exec(fs.readFileSync("src/unit_test_init.sql", {encoding: "utf-8"}));
  });

  describe(".getAll()", () => {
    it.todo("should return all defined ingredients");
  });

  describe(".get()", () => {
    it.todo("should return ingredient if it exists");
    it.todo("should throw NotFoundException if ingredient doesn't exist");
  });

  describe(".create()", () => {
    it.todo("should create and return the ingredient if it doesn't exist yet (no photo url)");
    it.todo("should create and return the ingredient if it doesn't exist yet (with photo url)");

    it.todo("should throw ConflictException if the ingredient already exists");
  });

  describe(".delete()", () => {
    it.todo("should delete the ingredient if it exists");

    it.todo("should throw NotFoundException if ingredient doesn't exist");
    it.todo("should throw ConflictException if ingredient is in use");
  });

  describe(".update()", () => {
    it.todo("should update the ingredient name if it exists and the new name is unique");
    it.todo("should update the ingredient description");
    it.todo("should update the ingredient alcohol flag");
    it.todo("should update the ingredient photo url");
    it.todo("should remove the ingredient photo url");
    it.todo("should be able to do all possible edits at once");

    it.todo("should throw NotFoundException if ingredient doesn't exist");
    it.todo("should throw BadRequestException when trying to set required properties to null");
    it.todo("should throw BadRequestException when the edits object is empty");
    it.todo("should throw ConflictException when trying to set the name to one already used by another ingredient");
  });
});
