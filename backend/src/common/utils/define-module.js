import { Router } from 'express';

// The Express version of a NestJS @Module():
//   name       unique module name
//   path       URL prefix under /api
//   providers  { serviceName: (container) => instance }
//   listeners  (events, container) => subscribe to events
//   routes     (router, container) => register endpoints
export function defineModule({ name, path, providers = {}, listeners, routes }) {
  return {
    name,
    path,
    providers,
    listeners,
    buildRouter(container) {
      const router = Router();
      routes?.(router, container);
      return router;
    },
  };
}
