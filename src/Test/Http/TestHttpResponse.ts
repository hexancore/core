import { Response } from 'light-my-request';
import { HttpStatus } from '@nestjs/common';

export class TestHttpResponse implements PromiseLike<Response> {
  private expects: Array<(res: Response) => void> = [];

  public constructor(private p: Promise<Response>) {}

  public then<TResult1 = Response|any, TResult2 = never>(
    onfulfilled?: (value: Response) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>,
  ): PromiseLike<TResult1 | TResult2> {
    return this.p
      .then((res) => {
        for (const e of this.expects) {
          e(res);
        }
        return res;
      })
      .then(onfulfilled, onrejected);
  }

  public expectStatusCode(expected: HttpStatus): TestHttpResponse {
    return this.expect((res) => {
      this.expectEq(res.statusCode, expected, 'Response.statusCode');
    });
  }

  public expectNoContent(): TestHttpResponse {
    this.expectStatusCode(HttpStatus.NO_CONTENT);
    this.expectBody('');
    return this;
  }

  public expectBody(expected: string): TestHttpResponse {
    return this.expect((res) => {
      this.expectEq(res.body, expected, 'Response.body');
    });
  }

  public expectJson(expectedBody: any, expectedStatusCode: HttpStatus = HttpStatus.OK): TestHttpResponse {
    this.expect((res) => {
      let parsed;
      try {
        parsed = JSON.parse(res.body);
      } catch (e) {
        throw new Error('Parse json response body: ' + res.body);
      }

      this.expectEq(parsed, expectedBody, 'Response.json');
    });
    this.expectStatusCode(expectedStatusCode);
    return this;
  }

  private expect(fn: (res: Response) => void): TestHttpResponse {
    this.expects.push(fn);
    return this;
  }

  private expectEq(current: any, expected: any, message: string): void {
    expect(current, message).toEqual(expected);
  }
}
