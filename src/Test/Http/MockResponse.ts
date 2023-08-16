import { HttpMethod } from '@/Infrastructure';
import { HttpStatus } from '@nestjs/common';
import * as http from 'http';

export interface MockRequest {
  method: HttpMethod;
  url: string;
}

export class MockResponse {
  private readonly headers: any;
  public statusCode: number;
  private _sent: boolean;
  private _body: any;

  public constructor(public request?: MockRequest) {
    this.headers = new http.OutgoingMessage().getHeaders();
    this.statusCode = 200;
    this._sent = false;
    this._body = null;

    this.request = request ?? { url: 'http://example.test/test', method: 'GET' };
  }

  public static create(request?: MockRequest): MockResponse {
    return new MockResponse(request);
  }

  public status(statusCode: number): MockResponse {
    this.statusCode = statusCode;
    return this;
  }

  public header(name: string, value: string): MockResponse {
    this.headers.append(name, value);
    return this;
  }

  public send(data: any) {
    this._sent = true;
    this._body = data;
    return this;
  }

  public get sent() {
    return this._sent;
  }

  public getHeader(name: string) {
    return this.headers.get(name);
  }

  public hasHeader(name: string) {
    return this.headers.has(name);
  }

  public get body() {
    return this._body;
  }

  public expectStatusCodeToEqual(expected: HttpStatus): void {
    expect(this.statusCode, 'Response.statusCode').toEqual(expected);
  }

  public expectBodyToEqual(expected: any): void {
    expect(this.body, 'Response.body').toEqual(expected);
  }
}
