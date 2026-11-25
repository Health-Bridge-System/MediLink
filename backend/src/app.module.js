import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/configuration.js';
import { Container } from './core/container.js';
import { EventBus } from './core/event-bus.js';
import { NotFoundException } from './common/exceptions/http.exception.js';
import { httpExceptionFilter } from './common/filters/http-exception.filter.js';
import { prisma } from './prisma/prisma.service.js';

// audit_log ids are BIGINT; JSON has no BigInt, so send them as numbers.
// eslint-disable-next-line no-extend-native
BigInt.prototype.toJSON = function toJSON() {
  return Number(this);
};

const MODULES_DIR = fileURLToPath(new URL('./modules/', import.meta.url));

// Every modules/<name>/<name>.module.js is picked up automatically,
// so adding a feature never means editing a shared list.
export async function loadModules() {
  const folders = (await readdir(MODULES_DIR, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  const modules = [];
  for (const folder of folders) {
    const file = new URL(`./modules/${folder}/${folder}.module.js`, import.meta.url);
    try {
      modules.push((await import(file.href)).default);
    } catch (err) {
      if (err.code !== 'ERR_MODULE_NOT_FOUND' || !err.message.includes(`${folder}.module.js`)) throw err;
    }
  }
  return modules;
}

export async function createApp({ modules } = {}) {
  const loaded = modules ?? (await loadModules());

  // Composition root: shared infrastructure first, then every module's providers.
  const container = new Container().value('prisma', prisma).value('events', new EventBus()).value('config', config);
  for (const mod of loaded) {
    for (const [name, factory] of Object.entries(mod.providers)) container.register(name, factory);
  }
  const events = container.resolve('events');
  for (const mod of loaded) mod.listeners?.(events, container);

  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGIN.split(',') }));
  app.use(express.json({ limit: '1mb' }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  for (const mod of loaded) app.use(`/api${mod.path}`, mod.buildRouter(container));

  app.use((req) => {
    throw new NotFoundException(`No route for ${req.method} ${req.path}`);
  });
  app.use(httpExceptionFilter);

  return { app, container, modules: loaded.map((m) => m.name) };
}

