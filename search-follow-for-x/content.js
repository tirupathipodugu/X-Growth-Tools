// Runs on x.com/search pages. Follows accounts from the People tab when a run is active.
(() => {
  if (window.__xsfStarted) return;
  window.__xsfStarted = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);
  const today = () => new Date().toISOString().slice(0, 10);
  const store = chrome.storage.local;

  async function log(msg) {
    const { log = [] } = await store.get('log');
    log.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
    await store.set({ log: log.slice(-300) });
    console.log('[XSF]', msg);
  }

  async function getRun() {
    const { run } = await store.get('run');
    return run;
  }

  async function stopRun(reason) {
    const run = await getRun();
    if (run) { run.active = false; await store.set({ run }); }
    await log(`stopped: ${reason}`);
  }

  function blocked() {
    const title = document.title.toLowerCase();
    if (title.includes('just a moment') || title.includes('attention required')) return 'Cloudflare challenge';
    if (document.querySelector('iframe[src*="challenges.cloudflare.com"], iframe[src*="arkoselabs"]')) return 'human verification';
    const toast = document.querySelector('[data-testid="toast"], [role="alert"]');
    const t = toast ? toast.innerText.toLowerCase() : '';
    if (t.includes('unable to follow') || t.includes('rate limit') || t.includes('try again later') || t.includes('something went wrong')) {
      return `X warning: "${toast.innerText.trim().slice(0, 80)}"`;
    }
    return null;
  }

  // Only cells inside the main results column, never the "Who to follow" sidebar.
  function resultCells() {
    const main = document.querySelector('[data-testid="primaryColumn"]');
    return main ? [...main.querySelectorAll('[data-testid="UserCell"]')] : [];
  }

  function handleOf(cell) {
    const span = [...cell.querySelectorAll('span')].find((s) => /^@\w{1,15}$/.test(s.textContent.trim()));
    return span ? span.textContent.trim().slice(1) : null;
  }

  function hasBio(cell) {
    // Bio is a dir="auto" text block that is not the name or @handle.
    const texts = [...cell.querySelectorAll('div[dir="auto"]')]
      .map((d) => d.innerText.trim())
      .filter((t) => t && !t.startsWith('@'));
    return texts.length >= 2;
  }

  async function waitFor(fn, timeout = 4000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const v = fn();
      if (v) return v;
      await sleep(250);
    }
    return null;
  }

  async function main() {
    let run = await getRun();
    if (!run || !run.active) return;
    // A run whose tab was closed long ago must not silently resume on a later visit.
    if (Date.now() - (run.startedAt || 0) > 2 * 60 * 60 * 1000) return stopRun('run expired (older than 2 hours)');

    const params = new URLSearchParams(location.search);
    if (params.get('f') !== 'user' || (params.get('q') || '').trim() !== run.query) return;

    await log(`page ready, looking for "${run.query}" accounts`);
    await waitFor(() => resultCells().length, 15000);

    const seen = new Set();
    let emptyScrolls = 0;

    while (true) {
      run = await getRun();
      if (!run || !run.active) return log('stopped by you');
      if (run.followed >= run.max) return stopRun(`done, followed ${run.followed}`);

      const { stats } = await store.get('stats');
      const todayCount = stats && stats.date === today() ? stats.count : 0;
      if (todayCount >= run.daily) return stopRun(`daily cap ${run.daily} reached`);

      const why = blocked();
      if (why) return stopRun(why);

      const cell = resultCells().find((c) => {
        const h = handleOf(c);
        return h && !seen.has(h.toLowerCase());
      });

      if (!cell) {
        window.scrollBy(0, window.innerHeight * 0.9);
        await sleep(rand(2000, 3500));
        if (++emptyScrolls >= 4) return stopRun(`no more results (followed ${run.followed})`);
        continue;
      }
      emptyScrolls = 0;

      const handle = handleOf(cell);
      seen.add(handle.toLowerCase());
      cell.scrollIntoView({ block: 'center', behavior: 'smooth' });
      await sleep(rand(800, 1600));

      if (cell.querySelector('button[data-testid$="-unfollow"]')) { await log(`skip @${handle}: already following`); continue; }
      const btn = cell.querySelector('button[data-testid$="-follow"]');
      if (!btn) { await log(`skip @${handle}: no follow button`); continue; }
      if (cell.querySelector('[data-testid="icon-lock"]')) { await log(`skip @${handle}: protected`); continue; }
      if (run.verifiedOnly && !cell.querySelector('[data-testid="icon-verified"]')) { await log(`skip @${handle}: not verified`); continue; }
      if (run.skipNoBio && !hasBio(cell)) { await log(`skip @${handle}: no bio`); continue; }

      btn.click();
      const ok = await waitFor(() => cell.querySelector('button[data-testid$="-unfollow"]'), 5000);
      if (!ok) {
        const reason = blocked() || 'follow did not stick';
        return stopRun(`@${handle}: ${reason}`);
      }

      run = await getRun();
      if (!run) return;
      run.followed += 1;
      const s = (await store.get('stats')).stats;
      const newStats = s && s.date === today() ? { date: s.date, count: s.count + 1 } : { date: today(), count: 1 };
      await store.set({ run, stats: newStats });
      await log(`followed @${handle} (${run.followed}/${run.max})`);

      if (run.followed >= run.max) return stopRun(`done, followed ${run.followed}`);
      const wait = rand(8000, 25000);
      await log(`waiting ${Math.round(wait / 1000)}s`);
      await sleep(wait);
    }
  }

  main().catch((e) => log(`error: ${e.message}`));
})();
