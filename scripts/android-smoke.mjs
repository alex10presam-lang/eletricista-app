// Testes locais em emulador. Não dispara mensagens nem compartilha com contatos.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const serial = process.env.ELETROPRO_DEVICE || 'emulator-5554';
if (!/^emulator-\d+$/.test(serial)) throw new Error('Este teste aceita somente emuladores.');
const adb = resolve(
  process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '',
  'platform-tools',
  process.platform === 'win32' ? 'adb.exe' : 'adb',
);
const appId = 'br.com.alexandre.eletropro';
const run = (...args) => execFileSync(adb, ['-s', serial, ...args], { timeout: 20_000 });
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(callback, label, timeout = 15_000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try {
      const value = await callback();
      if (value) return value;
    } catch {
      /* Aguarda a atividade e seu WebView. */
    }
    await pause(150);
  }
  throw new Error(`Tempo excedido: ${label}`);
}
async function connect() {
  const pid = await until(() => run('shell', 'pidof', appId).toString().trim(), 'processo Android');
  run('forward', 'tcp:9223', `localabstract:webview_devtools_remote_${pid}`);
  const page = await until(async () => {
    const list = await (await fetch('http://127.0.0.1:9223/json/list')).json();
    return list.find((p) => p.type === 'page' && p.url.startsWith('https://localhost'));
  }, 'interface Android');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  const pending = new Map();
  let sequence = 0;
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (!pending.has(data.id)) return;
    const { resolve, reject, timer } = pending.get(data.id);
    clearTimeout(timer);
    pending.delete(data.id);
    if (data.error) reject(new Error(data.error.message));
    else resolve(data.result);
  };
  const send = (method, params) =>
    new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Timeout CDP: ${method}`));
      }, 15_000);
      pending.set(id, { resolve, reject, timer });
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (callback, ...args) => {
    const result = await send('Runtime.evaluate', {
      expression: `(${callback.toString()})(...${JSON.stringify(args)})`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails)
      throw new Error(
        result.exceptionDetails.exception?.description || result.exceptionDetails.text,
      );
    return result.result.value;
  };
  await until(
    () => evaluate(() => !!document.querySelector('.welcome, .app-shell')),
    'carregamento do aplicativo',
  );
  return { evaluate, close: () => ws.close() };
}
async function click(cdp, text, selector = 'button') {
  await until(
    () =>
      cdp.evaluate(
        (text, selector) => {
          const buttons = [...document.querySelectorAll(selector)];
          const node = buttons.find(
            (b) =>
              (b.textContent.trim() === text ||
                b.querySelector('h3')?.textContent.trim() === text) &&
              !b.disabled &&
              !b.closest('[inert]'),
          );
          if (!node) return false;
          node.click();
          return true;
        },
        text,
        selector,
      ),
    `botão ${text}`,
  );
  await pause(180);
}
async function fill(cdp, label, value) {
  await until(
    () =>
      cdp.evaluate(
        (text, value) => {
          const labels = [...document.querySelectorAll('dialog[open] label')];
          const label = labels.find(
            (l) => l.textContent.trim() === text || l.querySelector('span')?.textContent === text,
          );
          const node = label?.htmlFor
            ? document.getElementById(label.htmlFor)
            : label?.querySelector('input,textarea,select');
          if (!node) return false;
          const proto = Object.getPrototypeOf(node);
          Object.getOwnPropertyDescriptor(proto, 'value').set.call(node, value);
          node.dispatchEvent(
            new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }),
          );
          return true;
        },
        label,
        value,
      ),
    `campo ${label}`,
  );
}
mkdirSync('artifacts', { recursive: true });
let cdp = await connect();
if (await cdp.evaluate(() => !!document.querySelector('.welcome'))) {
  await click(cdp, 'Explorar demonstração');
  await until(
    () => cdp.evaluate(() => !!document.querySelector('.demo-banner')),
    'abertura da demonstração',
  );
}
if (await cdp.evaluate(() => !document.querySelector('.demo-banner'))) {
  await click(cdp, 'Mais', '.bottom-nav button');
  await click(cdp, 'Explorar demonstração');
}
await until(
  () => cdp.evaluate(() => !!document.querySelector('.demo-banner')),
  'modo demonstração',
);
writeFileSync('artifacts/android-inicio.png', run('exec-out', 'screencap', '-p'));
await click(cdp, 'Orçamentos', '.bottom-nav button');
await until(
  () =>
    cdp.evaluate(() => {
      const card = document.querySelector('.quote-card');
      if (!card) return false;
      card.click();
      return true;
    }),
  'lista de propostas',
);
await click(cdp, 'Gerar e compartilhar PDF');
await until(
  () => run('shell', 'run-as', appId, 'ls', 'cache/exports').toString().includes('.pdf'),
  'PDF nativo',
);
const pdf = run('exec-out', 'run-as', appId, 'cat', 'cache/exports/ORC-0001-demo.pdf');
assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
writeFileSync('artifacts/orcamento-android.pdf', pdf);
await until(
  () =>
    /mCurrentFocus=.*(?:ChooserActivity|ResolverActivity)/.test(
      run('shell', 'dumpsys', 'window').toString(),
    ),
  'folha nativa de compartilhamento',
);
writeFileSync('artifacts/android-compartilhar.png', run('exec-out', 'screencap', '-p'));
run('shell', 'input', 'keyevent', '4');
await pause(300);
// O primeiro voltar fecha o compartilhamento; o segundo fecha o detalhe do orçamento.
run('shell', 'input', 'keyevent', '4');
await pause(300);
await click(cdp, 'Usar meus dados');
await click(cdp, 'Clientes', '.bottom-nav button');
await click(cdp, 'Novo');
await fill(cdp, 'Nome do cliente', 'Teste Android sem conexão');
await fill(cdp, 'Endereço', 'Endereço fictício do teste Android');
await click(cdp, 'Cadastrar cliente', 'dialog[open] button');
await until(
  () =>
    cdp.evaluate(
      () =>
        document.body.innerText.includes('Teste Android sem conexão') &&
        !document.querySelector('dialog'),
    ),
  'cliente salvo',
);
cdp.close();
run('shell', 'svc', 'wifi', 'disable');
run('shell', 'svc', 'data', 'disable');
run('shell', 'am', 'force-stop', appId);
run('shell', 'am', 'start', '-n', `${appId}/.MainActivity`);
cdp = await connect();
await click(cdp, 'Clientes', '.bottom-nav button');
assert.equal(
  await cdp.evaluate(() => document.body.innerText.includes('Teste Android sem conexão')),
  true,
);
writeFileSync('artifacts/android-offline.png', run('exec-out', 'screencap', '-p'));
cdp.close();
run('forward', '--remove', 'tcp:9223');
console.log(
  'Android: abertura, PDF nativo, compartilhamento, cadastro e reabertura sem rede aprovados.',
);
