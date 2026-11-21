// In-process publish/subscribe. A module announces what happened
// ("order.placed"); other modules react without the publisher knowing them.
// Handlers run in registration order; a failing handler is logged and never
// breaks the request that published the event.
export class EventBus {
  #handlers = new Map();

  on(event, name, handler) {
    if (!this.#handlers.has(event)) this.#handlers.set(event, []);
    this.#handlers.get(event).push({ name, handler });
  }

  // Resolves to the merged objects returned by the handlers, e.g. { alerts, orderStatus }.
  async emit(event, payload) {
    const merged = {};
    for (const { name, handler } of this.#handlers.get(event) ?? []) {
      try {
        const out = await handler(payload);
        if (out && typeof out === 'object') Object.assign(merged, out);
      } catch (err) {
        console.error(`[events] ${event} -> ${name} failed:`, err.message);
      }
    }
    return merged;
  }
}
