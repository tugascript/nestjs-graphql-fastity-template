import { Test, TestingModule } from '@nestjs/testing';
import { SocialAuthController } from './social-auth.controller';

describe('SocialAuthController', () => {
  let controller: SocialAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocialAuthController],
    }).compile();

    controller = module.get<SocialAuthController>(SocialAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
