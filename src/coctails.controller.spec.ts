import { Test, TestingModule } from '@nestjs/testing';
import { CoctailsController } from './coctails.controller';
import { DBService } from './db.service';

describe('AppController', () => {
  let appController: CoctailsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CoctailsController],
      providers: [DBService],
    }).compile();

    appController = app.get<CoctailsController>(CoctailsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
