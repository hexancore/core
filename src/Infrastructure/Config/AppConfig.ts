import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecretsService } from './SecretsService';

@Injectable()
export class AppConfig {
  public constructor(public readonly config: ConfigService, public readonly secrets: SecretsService) {}
}
