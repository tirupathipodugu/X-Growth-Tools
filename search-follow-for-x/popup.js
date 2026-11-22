const $ = (id) => document.getElementById(id);
const today = () => new Date().toISOString().slice(0, 10);

const LABELS = { found: 'Waiting', next: 'Checking…', followed: 'Followed', skipped: 'Skipped', failed: 'Failed' };

function renderResults(results = []) {
  const list = $('results');
  list.textContent = '';
  results.forEach((r, i) => {
    const li = document.createElement('li');
    li.title = r.reason ? `${LABELS[r.status]}: ${r.reason}` : `Open @${r.handle} on X`;
    li.addEventListener('click', () => chrome.tabs.create({ url: `https://x.com/${r.handle}` }));

    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = i + 1;

    const who = document.createElement('div');
    who.className = 'who';
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = r.name || r.handle;
    if (r.verified) {
      const tick = document.createElement('span');
      tick.className = 'tick';
      tick.textContent = ' ✓';
      name.appendChild(tick);
    }
    const handle = document.createElement('div');
    handle.className = 'handle';
    handle.textContent = r.reason ? `@${r.handle} · ${r.reason}` : `@${r.handle}`;
    who.append(name, handle);

    const badge = document.createElement('span');
    badge.className = `badge ${r.status}`;
    badge.textContent = LABELS[r.status] || r.status;

    li.append(num, who, badge);
    list.appendChild(li);
  });

  const n = (s) => results.filter((r) => r.status === s).length;
  $('counts').textContent = results.length
    ? `${results.length} found · ${n('followed')} followed · ${n('skipped')} skipped`
    : '';

  const current = list.querySelector('.badge.next');
  if (current) current.closest('li').scrollIntoView({ block: 'nearest' });
}

async function render() {
  const { run, stats, log = [], settings, results, tabId } =
    await chrome.storage.local.get(['run', 'stats', 'log', 'settings', 'results', 'tabId']);
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
  // Only offer "Show the X tab" if you've since moved to a different tab.
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  $('showTab').style.display = run && run.active && tabId && active && active.id !== tabId ? 'block' : 'none';
  renderResults(results);
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
  await chrome.storage.local.set({
    settings, run, results: [],
    log: [`[${new Date().toLocaleTimeString()}] start "${query}"`],
  });
  const url = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=user`;
  // Use the tab you're on. On X, the page switches to the search without reloading;
  // anywhere else, this same tab loads the search.
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.storage.local.set({ tabId: tab.id });
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'xsf-start', query });
  } catch {
    await chrome.tabs.update(tab.id, { url });
  }
  render();
});

$('stop').addEventListener('click', async () => {
  const { run } = await chrome.storage.local.get('run');
  if (run) { run.active = false; await chrome.storage.local.set({ run }); }
  render();
});

$('showTab').addEventListener('click', async () => {
  const { tabId } = await chrome.storage.local.get('tabId');
  if (tabId) chrome.tabs.update(tabId, { active: true }).catch(() => {});
});

chrome.storage.onChanged.addListener(render);
render();
