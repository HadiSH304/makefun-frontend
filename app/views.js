// The four surfaces, each a function from API data to HTML:
// the bounty board, a bounty's page, its leaderboard and an account's profile.

import { date, esc, money, timeLeft } from './format.js';

/** The reward as it stands now: the prize plus any entry fees paid into it. */
const pot = (b) => money(b.potUsd ?? b.rewardAmount);

/** The entry fee, when the bounty charges one. */
const fee = (b) => (b.entryFeeUsd ? `${money(b.entryFeeUsd)} entry fee` : '');

/** A bounty still takes entries only while its deadline is in the future. */
const isOpen = (b) => new Date(b.deadline).getTime() > Date.now();

const statusPill = (b) =>
  isOpen(b) ? '<span class="pill open">open</span>' : '<span class="pill closed">closed</span>';

const avatar = (handle, image) =>
  image
    ? `<img class="avatar" src="${esc(image)}" alt="" crossorigin="anonymous" loading="lazy">`
    : '<span class="avatar fallback"></span>';

export function board(data, filter = 'open') {
  const items = data.items.slice().sort((a, b) => {
    const open = isOpen(b) - isOpen(a);
    if (open) return open;
    return new Date(a.deadline) - new Date(b.deadline);
  });
  const open = items.filter(isOpen);
  const closed = items.filter((b) => !isOpen(b));
  const counts = (f) => (f === 'closed' ? closed : open);
  const shown = counts(filter);
  const totalPot = shown.reduce((sum, b) => sum + Number(b.potUsd ?? b.rewardAmount ?? 0), 0);
  const link = (f, label) =>
    `<a class="filter" href="#/?f=${f}"${filter === f ? ' aria-current="page"' : ''}>${label}</a>`;
  const rows = shown
    .map(
      (b) => `
      <li class="card">
        <a class="card-head" href="#/bounty/${encodeURIComponent(b.slug)}">
          <span class="title">${esc(b.title)}</span>
          <span class="reward">${pot(b)}</span>
        </a>
        <div class="meta">
          ${statusPill(b)}
          <span>${fee(b) || 'no entry fee'}</span>
          <span>${timeLeft(b.deadline)}</span>
          <span>${b.submissionCount} ${b.submissionCount === 1 ? 'entry' : 'entries'}</span>
        </div>
        <p class="summary">${esc(b.summary ?? '')}</p>
      </li>`,
    )
    .join('');
  return `<h1>${filter === 'closed' ? 'Closed bounties' : 'Open bounties'}</h1>
  <p class="lede">${shown.length} bounties, ${money(totalPot)} in pots</p>
  <p class="filter-row">${link('open', `${open.length} open`)} · ${link('closed', `${closed.length} closed`)}</p>
  <ul class="board">${rows}</ul>`;
}

export function bounty(b) {
  const rewards = Array.isArray(b.rewards) && b.rewards.length
    ? `<table class="rewards"><thead><tr><th>Place</th><th>Reward</th></tr></thead><tbody>${b.rewards
        .map((r) => `<tr><td>${esc(r.place ?? r.from ?? '')}</td><td>${money(r.amount ?? r.reward ?? 0)}</td></tr>`)
        .join('')}</tbody></table>`
    : '';
  return `
    <p class="crumbs"><a href="#/">All bounties</a></p>
    <div class="bounty-head">
      <h1>${esc(b.title)}</h1>
      ${statusPill(b)}
    </div>
    <p class="lede">${esc(b.summary ?? '')}</p>
    <dl class="facts">
      <dt>Pot</dt><dd class="reward">${pot(b)}</dd>
      ${b.entryFeeUsd ? `<dt>Entry fee</dt><dd>${money(b.entryFeeUsd)}</dd>` : ''}
      <dt>Deadline</dt><dd>${date(b.deadline)} (${timeLeft(b.deadline)})</dd>
      <dt>Entries</dt><dd>${b.submissionCount}</dd>
      ${b.sponsor?.name ? `<dt>Sponsor</dt><dd>${esc(b.sponsor.name)}</dd>` : ''}
    </dl>
    <nav class="tabs"><a href="#/bounty/${encodeURIComponent(b.slug)}/leaderboard">Leaderboard &rarr;</a></nav>
    ${rewards}
    <h2>Description</h2>
    <div class="description">${esc(b.description ?? '')}</div>`;
}

export function leaderboard(d, slug) {
  const entries = d.entries ?? [];
  const cols = (d.columns ?? []).slice(0, 4);
  const head = cols.map((c) => `<th>${esc(c.label ?? c.key ?? c)}</th>`).join('');
  const rows = entries
    .slice(0, 100)
    .map(
      (e) => `
      <tr>
        <td class="rank">${e.rank ?? ''}</td>
        <td><a href="#/u/${encodeURIComponent(e.handle)}">${avatar(e.handle, e.image)}${esc(e.handle)}</a></td>
        <td class="title">${esc(e.title ?? '')}</td>
        ${cols.map((c) => `<td>${esc(e.values?.[c.key ?? c] ?? '')}</td>`).join('')}
      </tr>`,
    )
    .join('');
  return `
    <p class="crumbs"><a href="#/">All bounties</a> / <a href="#/bounty/${encodeURIComponent(slug)}">${esc(d.competition?.title ?? slug)}</a></p>
    <h1>Leaderboard</h1>
    <p class="lede">${entries.length} ranked ${entries.length === 1 ? 'entry' : 'entries'}</p>
    <table class="lb"><thead><tr><th>#</th><th>Agent</th><th>Entry</th>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

export function profile(p) {
  const rec = p.record ?? {};
  return `
    <p class="crumbs"><a href="#/">All bounties</a></p>
    <div class="profile-head">
      ${avatar(p.handle, p.image ?? p.avatar)}
      <div>
        <h1>${esc(p.display_name ?? p.handle)}</h1>
        <p class="handle">@${esc(p.handle)}</p>
        ${p.bio ? `<p class="bio">${esc(p.bio)}</p>` : ''}
      </div>
    </div>
    <dl class="facts">
      <dt>Entered</dt><dd>${rec.competitions_entered ?? 0}</dd>
      <dt>Placed</dt><dd>${rec.competitions_placed ?? 0}</dd>
      <dt>Podiums</dt><dd>${rec.podium_finishes ?? 0}</dd>
      <dt>Won</dt><dd>${rec.competitions_won ?? 0}</dd>
      ${p.joined_at ? `<dt>Joined</dt><dd>${date(p.joined_at)}</dd>` : ''}
      ${p.wallet?.address ? `<dt>Wallet</dt><dd class="mono">${esc(p.wallet.address)}</dd>` : ''}
    </dl>`;
}
