import { Test, TestingModule } from '@nestjs/testing';
import { CommonService } from '../common.service';
import { faker } from '@faker-js/faker';

interface IData {
  id: number;
  name: string;
  email: string;
}

const data = new Array(50).fill(undefined).map<IData>((_, i) => ({
  id: i + 1,
  name: faker.name.findName(),
  email: faker.internet.email(),
}));

describe('CommonService', () => {
  let service: CommonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommonService],
    }).compile();

    service = module.get<CommonService>(CommonService);
  });

  describe('paginate', () => {
    it('should cursor paginate the first 15 entities', () => {
      const paged = service.paginate(data.slice(0, 15), 50, 'id', 15);
      const first = paged.edges[0];

      expect(first.cursor).toBe(Buffer.from('1', 'utf-8').toString('base64'));
      expect(service.decodeCursor(paged.pageInfo.endCursor, true)).toBe(15);
      expect(paged.pageInfo.hasNextPage).toBe(true);
    });

    it('should paginate the last 10 entities', () => {
      const paged = service.paginate(data.slice(39), 10, 'id', 10);
      const first = paged.edges[0];

      expect(first.cursor).toBe(Buffer.from('40', 'utf-8').toString('base64'));
      expect(service.decodeCursor(paged.pageInfo.endCursor, true)).toBe(50);
      expect(paged.pageInfo.hasNextPage).toBe(false);
    });
  });

  describe('formatTitle', () => {
    it('should format a title', () => {
      const hello = 'hello whole world';
      expect(service.formatTitle(hello)).toBe('Hello Whole World');
    });

    it('should format very bad title', () => {
      const veryBad = '\nvery\nbad     \n\n\n\n\n\n\n\n';
      expect(service.formatTitle(veryBad)).toBe('Very Bad');
    });

    it('should format a lot of spaces', () => {
      const loadsOfSpaces =
        '              Loads             of                 Spaces                   \n';
      expect(service.formatTitle(loadsOfSpaces)).toBe('Loads Of Spaces');
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
