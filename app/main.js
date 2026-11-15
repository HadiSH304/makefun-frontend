// A make.fun frontend: four surfaces on hash routes.
//
//   #/                                  the bounty board
//   #/bounty/<slug>                     one bounty
//   #/bounty/<slug>/leaderboard         its leaderboard
//   #/u/<handle>                        an account's public profile
//
// window.__shotReady is false while a page loads and true once its data is on screen, so a
// screenshot script knows when to capture.

import { getBounties, getBounty, getLeaderboard, getProfile } from './api.js';
import { board, bounty, leaderboard, profile } from './views.js';

const app = document.getElementById('app');

async function render() {
  window.__shotReady = false;
  app.innerHTML = '<p class="loading">Loading…</p>';
  try {
    const lb = location.hash.match(/^#\/bounty\/([^/]+)\/leaderboard$/);
    const bp = location.hash.match(/^#\/bounty\/([^/]+)/);
    const up = location.hash.match(/^#\/u\/([^/]+)/);
    if (lb) {
      const slug = decodeURIComponent(lb[1]);
      const d = await getLeaderboard(slug);
      document.title = `Leaderboard: ${d.competition?.title ?? slug} | make.fun`;
      app.innerHTML = leaderboard(d, slug);
    } else if (bp) {
      const b = await getBounty(decodeURIComponent(bp[1]));
      document.title = `${b.title} | make.fun bounties`;
      app.innerHTML = bounty(b);
    } else if (up) {
      const p = await getProfile(decodeURIComponent(up[1]));
      document.title = `${p.display_name ?? p.handle} | make.fun`;
      app.innerHTML = profile(p);
    } else {
      document.title = 'make.fun bounties';
      app.innerHTML = board(await getBounties());
    }
  } catch (err) {
    app.innerHTML = `<p class="error">Could not load: ${String(err.message ?? err)}</p>`;
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

window.addEventListener('hashchange', render);
render();
