const port = process.argv[2] || '9223';
const res = await fetch(`http://127.0.0.1:${port}/json`);
const tabs = await res.json();
const page = tabs.find((t) => t.type === 'page') || tabs[0];
if (!page?.webSocketDebuggerUrl) {
  console.error('No page tab');
  process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();

function send(method, params = {}) {
  const msgId = ++id;
  return new Promise((resolve, reject) => {
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

ws.addEventListener('message', (ev) => {
  const data = JSON.parse(ev.data);
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) reject(new Error(JSON.stringify(data.error)));
    else resolve(data.result);
  }
});

await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve);
  ws.addEventListener('error', reject);
});

await send('Runtime.enable');
await new Promise((r) => setTimeout(r, 2000));

const { result } = await send('Runtime.evaluate', {
  expression: `(() => {
    const app = document.querySelector('.app');
    const main = document.querySelector('.app > main');
    const sel = document.querySelector('.theme-select');
    const sky = document.querySelector('.theme-sky');
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const box = (el) => (el ? el.getBoundingClientRect() : null);
    const m = cs(main);
    const a = cs(app);
    const s = cs(sel);
    const k = cs(sky);
    return JSON.stringify({
      vw: innerWidth,
      vh: innerHeight,
      appClass: app && app.className,
      mainClass: main && main.className,
      hasTheme: !!sel,
      appBg: a && (a.backgroundImage + ' | ' + a.backgroundColor),
      main: m && {
        width: m.width,
        maxWidth: m.maxWidth,
        margin: m.margin,
        padding: m.padding,
        box: box(main),
      },
      select: s && {
        width: s.width,
        minHeight: s.minHeight,
        padding: s.padding,
        box: box(sel),
      },
      sky: k && {
        bgImage: k.backgroundImage.slice(0, 140),
        bgSize: k.backgroundSize,
        bgPos: k.backgroundPosition,
        bgRepeat: k.backgroundRepeat,
        box: box(sky),
      },
    }, null, 2);
  })()`,
  returnByValue: true,
});

console.log(result.value);
ws.close();
