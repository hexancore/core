import { AppMeta } from '@hexancore/common';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const appMeta = AppMeta.get();
  const b = new DocumentBuilder().setTitle(appMeta.id + ' API').setVersion(appMeta.version);

  const document = SwaggerModule.createDocument(app, b.build());
  SwaggerModule.setup('apidoc', app, document);
}
