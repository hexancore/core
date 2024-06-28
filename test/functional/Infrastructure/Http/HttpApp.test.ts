import { HcHttpModule } from '@/Infrastructure/Http';
import { HttpAppTestWrapper } from '@/Test/Http/HttpAppTestHelper';
import { OK } from '@hexancore/common';
import { Body, Controller, Get, Global, HttpStatus, Module, Param, ParseIntPipe, Post } from '@nestjs/common';

interface Fruit {
  id: number;
  name: string;
}

@Controller({ path: 'fruits' })
class FruitsController {
  private fruits: Map<number, Fruit>;

  public constructor() {
    this.fruits = new Map();
  }

  @Post('')
  public create(@Body() body: Record<string, any>) {
    this.fruits.set(1, { id: 1, name: body.name });
    return OK(null);
  }

  @Get('')
  public getList() {
    return OK(Array.from(this.fruits.values()));
  }

  @Get(':id')
  public get(@Param('id', ParseIntPipe) id: number) {
    return OK(this.fruits.get(id));
  }
}

@Global()
@Module({
  controllers: [FruitsController],
  imports: [HcHttpModule]
})
class FruitModule {
}

describe('HttpApp', () => {
  let app: HttpAppTestWrapper;
  beforeAll(async () => {
    app = await HttpAppTestWrapper.create(FruitModule);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  test('Http Communication', async () => {
    await app.post('/fruits', { name: 'banana', }).expectJson(null, HttpStatus.CREATED);
    await app.get('/fruits/1').expectJson({id: 1, name: 'banana' });
    await app.get('/fruits').expectJson([{ id: 1, name: 'banana' }]);
  });
});
