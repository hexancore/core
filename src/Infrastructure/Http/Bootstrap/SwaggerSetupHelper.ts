import { AppMeta } from '@hexancore/common';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export interface HcSwaggerOptions {
  metadataFn?: () => Promise<Record<string, any>>;
}

export async function setupSwagger(app: INestApplication, options: HcSwaggerOptions): Promise<void> {
  const appMeta = AppMeta.get();
  const b = new DocumentBuilder().setTitle(appMeta.id + ' API').setVersion(appMeta.version);

  if (options.metadataFn) {
    await SwaggerModule.loadPluginMetadata(options.metadataFn);
  }
  const document = SwaggerModule.createDocument(app, b.build());
  SwaggerModule.setup('apidoc', app, document);
}
