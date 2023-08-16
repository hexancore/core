import { HttpAppTestWrapper } from '@/Test/Http/HttpAppTestHelper';
import { OK } from '@hexancore/common';
import { Controller, Get, Module, Post, Res, Body } from '@nestjs/common';

interface Fruit {
  name: string;
}

@Controller({ path: 'fruits' })
class FruitsController {
  private fruits: Array<Fruit>;

  public constructor() {
    this.fruits = [];
  }

  @Post('')
  public create(@Body() body: Record<string, any>) {
    this.fruits.push({ name: body.name });
    return OK(null);
  }

  @Get('')
  public getList() {
    return OK(this.fruits);
  }
}

@Module({
  controllers: [FruitsController],
})
class FruitModule {}

describe('HttpApp', () => {
  let app: HttpAppTestWrapper;
  beforeAll(async () => {
    app = await HttpAppTestWrapper.create(FruitModule);
  });

  afterAll(async () => {
    await app.close();
  });

  test('Http Communication', async () => {
    await app.post('/fruits', { name: 'banana' }).expectNoContent();
    await app.get('/fruits').expectJson([{ name: 'banana' }]);
  });
});
