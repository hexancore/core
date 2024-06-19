import { HttpStatus } from '@nestjs/common';
import * as http from 'http';
import { MockRequest } from './MockRequest';
import { CookieSerializeOptions } from '@fastify/cookie';
import type { OutgoingHttpHeaders } from 'http2';

export class MockResponse {
  private _headers: OutgoingHttpHeaders;
  public statusCode: number;
  public cookies = {};
  public clearedCookies = {};
  private _sent: boolean;
  private _body: any;

  public constructor(public request?: MockRequest) {
    this._headers = new http.OutgoingMessage().getHeaders();
    this.statusCode = 200;
    this._sent = false;
    this._body = null;

    this.request = request ?? new MockRequest('GET', 'http://example.test/test');
  }

  public static create(request?: MockRequest): MockResponse {
    return new MockResponse(request);
  }

  public status(statusCode: number): this {
    this.statusCode = statusCode;
    return this;
  }

  public type(contentType: string): this {
    this.header("content-type", contentType);
    return this;
  }

  public header(name: keyof OutgoingHttpHeaders, value: any): this {
    this._headers[name] = value;
    return this;
  }

  public send(data: any): this {
    this._sent = true;
    this._body = data;
    return this;
  }

  public get sent(): boolean {
    return this._sent;
  }

  public getHeader(name: string): any {
    return this._headers[name];
  }

  public hasHeader(name: string): boolean {
    return this._headers[name] !== undefined;
  }

  public get body(): any {
    return this._body;
  }

  public setCookie(name: string, value: any, options?: CookieSerializeOptions): void {
    this.cookies[name] = { value, options };
  }

  public clearCookie(name: string, options?: CookieSerializeOptions): void {
    delete this.cookies[name];
    this.clearedCookies[name] = options;
  }

  public expectSetCookie(name: string, options?: CookieSerializeOptions): void {
    if (options) {
      expect(this.cookies[name], `Response.setCookie(${name})`).toMatchObject(options);
    } else {
      expect(name in this.cookies, `Response.setCookie(${name})`).toBeTruthy();
    }
  }

  public expectClearCookie(name: string, options?: CookieSerializeOptions): void {
    if (options) {
      expect(this.clearedCookies[name], `Response.clearCookie(${name})`).toMatchObject(options);
    } else {
      expect(name in this.clearedCookies, `Response.clearCookie(${name})`).toBeTruthy();
    }
  }

  public expectStatusCodeToEqual(expected: HttpStatus): void {
    expect(this.statusCode, 'Response.statusCode').toEqual(expected);
  }

  public expectBodyToEqual(expected: any): void {
    expect(this.body, 'Response.body').toEqual(expected);
  }
}
