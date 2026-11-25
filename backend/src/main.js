import { config } from './config/configuration.js';
import { createApp } from './app.module.js';
import { connectPrisma, disconnectPrisma } from './prisma/prisma.service.js';

async function bootstrap() {
  await connectPrisma();
  const { app, modules } = await createApp();
  const server = app.listen(config.PORT, () => {
    console.log(`MediLink API listening on http://localhost:${config.PORT}/api (${modules.length} modules: ${modules.join(', ')})`);
  });

  const shutdown = async () => {
    server.close();
    await disconnectPrisma();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('Failed to start MediLink API:', err.message);
  process.exit(1);
});
