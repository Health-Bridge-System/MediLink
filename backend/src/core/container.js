// Minimal dependency-injection container (the composition root).
// Modules register providers by name and resolve what they need by name,
// so no module imports another module's classes directly.
export class Container {
  #factories = new Map();
  #instances = new Map();

  value(name, instance) {
    this.#instances.set(name, instance);
    return this;
  }

  register(name, factory) {
    if (this.#factories.has(name) || this.#instances.has(name)) {
      throw new Error(`Provider "${name}" is registered twice`);
    }
    this.#factories.set(name, factory);
    return this;
  }

  resolve(name) {
    if (this.#instances.has(name)) return this.#instances.get(name);
    const factory = this.#factories.get(name);
    if (!factory) throw new Error(`No provider named "${name}"`);
    const instance = factory(this);
    this.#instances.set(name, instance);
    return instance;
  }
}
