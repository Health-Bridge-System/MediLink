import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container } from '../src/core/container.js';
import { EventBus } from '../src/core/event-bus.js';

test('container builds a provider once and reuses it', () => {
  const c = new Container();
  let built = 0;
  c.register('thing', () => ({ n: ++built }));
  assert.equal(c.resolve('thing'), c.resolve('thing'));
  assert.equal(built, 1);
});

test('container refuses duplicate and unknown providers', () => {
  const c = new Container().register('a', () => 1);
  assert.throws(() => c.register('a', () => 2), /registered twice/);
  assert.throws(() => c.resolve('missing'), /No provider/);
});

test('event bus merges handler results and isolates failures', async () => {
  const bus = new EventBus();
  bus.on('e', 'one', () => ({ a: 1 }));
  bus.on('e', 'broken', () => {
    throw new Error('boom');
  });
  bus.on('e', 'two', async () => ({ b: 2 }));
  const original = console.error;
  console.error = () => {};
  const out = await bus.emit('e', {});
  console.error = original;
  assert.deepEqual(out, { a: 1, b: 2 });
});
