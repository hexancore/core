import { ConfigModule, ConfigService } from '@nestjs/config';
import { Global, Module, Provider } from '@nestjs/common';
import { APP_PATHS } from '../AppPaths';
import configFactory from './YamlConfigLoader';
import { SecretsService } from './SecretsService';

const RootConfigModule = ConfigModule.forRoot({
  load: [() => configFactory(APP_PATHS.configFilePath)],
  isGlobal: true,
  ignoreEnvVars: true,
});

const SecretsServiceProvider: Provider = {
  provide: SecretsService,
  useFactory: () => new SecretsService(APP_PATHS.secretsDir),
};

@Global()
@Module({
  imports: [RootConfigModule],
  providers: [ConfigService, SecretsServiceProvider],
  exports: [RootConfigModule, ConfigService, SecretsServiceProvider],
})
export class HcAppConfigModule {}
