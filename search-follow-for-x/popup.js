const $ = (id) => document.getElementById(id);
const today = () => new Date().toISOString().slice(0, 10);

async function render() {
  const { run, stats, log = [], settings } = await chrome.storage.local.get(['run', 'stats', 'log', 'settings']);
  if (settings && !$('query').dataset.loaded) {
    $('query').value = settings.query || '';
    $('max').value = settings.max || 10;
    $('daily').value = settings.daily || 40;
    $('verifiedOnly').checked = !!settings.verifiedOnly;
    $('skipNoBio').checked = settings.skipNoBio !== false;
    $('query').dataset.loaded = '1';
  }
  const todayCount = stats && stats.date === today() ? stats.count : 0;
  const state = run && run.active
    ? `Running: ${run.followed}/${run.max} followed for "${run.query}"`
    : 'Idle';
  $('status').textContent = `${state} · today: ${todayCount}`;
  $('log').textContent = log.slice(-60).reverse().join('\n');
}

$('start').addEventListener('click', async () => {
  const query = $('query').value.trim();
  if (!query) { $('status').textContent = 'Type something to search first.'; return; }
  const settings = {
    query,
    max: Math.min(25, Math.max(1, parseInt($('max').value, 10) || 10)),
    daily: Math.min(100, Math.max(1, parseInt($('daily').value, 10) || 40)),
    verifiedOnly: $('verifiedOnly').checked,
    skipNoBio: $('skipNoBio').checked,
  };
  const { stats } = await chrome.storage.local.get('stats');
  const todayCount = stats && stats.date === today() ? stats.count : 0;
  if (todayCount >= settings.daily) {
    await chrome.storage.local.set({ settings });
    $('status').textContent = `Daily cap reached (${todayCount}/${settings.daily}). Try again tomorrow.`;
    return;
  }
  const run = { ...settings, active: true, followed: 0, startedAt: Date.now() };
  await chrome.storage.local.set({ settings, run, log: [`[${new Date().toLocaleTimeString()}] start "${query}"`] });
  const url = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=user`;
  await chrome.tabs.create({ url, active: true });
  render();
});

$('stop').addEventListener('click', async () => {
  const { run } = await chrome.storage.local.get('run');
  if (run) { run.active = false; await chrome.storage.local.set({ run }); }
  render();
});

chrome.storage.onChanged.addListener(render);
render();
