import { R, SAR } from '@hexancore/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

export interface GroupableInterceptor<A, DT = any, RT = DT> {
  beforeRoute(args: A): SAR<boolean>;
  afterRoute(args: A, data: SAR<DT>): SAR<RT>;
  getName(): string;
}

export type HttpGroupableInterceptor<A, DT = any, RT = any> = GroupableInterceptor<HttpArgumentsHost, DT, RT>;
