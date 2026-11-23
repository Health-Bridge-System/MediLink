// Shared test helpers: boot the real app on a random port against the
// seeded MySQL database (run `npm run db:seed` first).
process.env.NODE_ENV = 'test';

const { createApp } = await import('../src/app.module.js');
const { disconnectPrisma } = await import('../src/prisma/prisma.service.js');

export async function startServer() {
  const { app } = await createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}/api`;

  async function request(method, path, { token, body } = {}) {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  }

  // Quick sign-in needs DEMO_MODE=true in .env.
  async function tokenFor(username) {
    const res = await request('POST', '/auth/demo-login', { body: { username } });
    if (res.status !== 200) throw new Error(`Could not sign in as ${username}: ${res.body?.message}`);
    return res.body.token;
  }

  async function stop() {
    await new Promise((resolve) => server.close(resolve));
  }

  return { request, tokenFor, stop };
}

export { disconnectPrisma };
