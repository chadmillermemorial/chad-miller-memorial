import assert from 'node:assert/strict';
import test from 'node:test';

async function lifecycle() {
  try { return await import('./event-lifecycle.ts'); }
  catch (error) { if (error.code === 'ERR_MODULE_NOT_FOUND') return {}; throw error; }
}

test('closed tournament refuses API registration before downstream side effects', async () => {
  const { registrationClosed, eventStatus } = await lifecycle();
  assert.equal(eventStatus?.registrationOpen, false);
  assert.equal(typeof registrationClosed, 'function');
  const response = registrationClosed(new Request('https://example.org/api/player-registration', { method: 'POST' }));
  assert.equal(response.status, 410);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { ok: false, closed: true, eventYear: 2026, error: 'The 2026 tournament has concluded. Registration and the waitlist are closed. 2027 registration is not open yet.' });
});

test('old browser form submissions receive an understandable closure page', async () => {
  const { registrationClosed } = await lifecycle();
  assert.equal(typeof registrationClosed, 'function');
  const response = registrationClosed(new Request('https://example.org/api/waitlist-registration', { method: 'POST', headers: { accept: 'text/html' } }));
  assert.equal(response.status, 410);
  assert.match(response.headers.get('content-type'), /text\/html/);
  const html = await response.text();
  assert.match(html, /2026 tournament has concluded/);
  assert.match(html, /href="\/register"/);
  assert.doesNotMatch(html, /<form/);
});

test('every closed enrollment endpoint refuses stale forms without calling external services', async () => {
  const fs = await import('node:fs');
  const vm = await import('node:vm');
  const ts = (await import('typescript')).default;
  const { eventStatus, registrationClosed } = await lifecycle();
  for (const name of ['player-registration', 'sponsor-checkout', 'waitlist-registration', 'volunteer-registration', 'in-kind-donation']) {
    const path = `app/api/${name}/route.ts`;
    const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const module = { exports: {} };
    let externalCalls = 0;
    vm.runInNewContext(code, {
      module, exports: module.exports,
      require(id) {
        if (id === '@/lib/event-lifecycle') return { eventStatus, registrationClosed };
        if (id === 'stripe') return class { constructor() { externalCalls++; throw new Error('Stripe must not be called'); } };
        if (id === 'crypto') return {};
        return {};
      },
      process: { env: {} },
      fetch() { externalCalls++; throw new Error('Network must not be called'); },
    });
    for (const accept of ['application/json', 'text/html']) {
      const request = new Request(`https://example.org/api/${name}`, { method: 'POST', headers: { accept } });
      request.formData = () => { throw new Error('Closed forms must not be parsed'); };
      const response = await module.exports.POST(request);
      assert.equal(response.status, 410, name);
    }
    assert.equal(externalCalls, 0, name);
  }
});
