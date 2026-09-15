import { resolveWatchDomain } from './watch-domains.js';

const LEGACY_HOST = 'vidsrc2.ru';
const infoIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/></svg>';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

export function parseLegacyPlayerUrl(value) {
  try {
    const url = new URL(value);
    if (url.hostname !== LEGACY_HOST) return null;
    const [, embed, type, imdb, season = '1', episode = '1'] = url.pathname.split('/');
    if (embed !== 'embed' || !['movie', 'tv'].includes(type) || !/^tt\d+$/.test(imdb)) return null;
    return { type, imdb, season: Number(season) || 1, episode: Number(episode) || 1 };
  } catch { return null; }
}

export function rewriteLegacyPlayerMarkup(markup) {
  if (typeof markup !== 'string' || !markup.includes(`https://${LEGACY_HOST}/embed/`)) return markup;
  return markup.replace(
    /(<iframe\b[^>]*\bsrc=")(https:\/\/vidsrc2\.ru\/embed\/(?:movie|tv)\/[^"\s]+)(")/g,
    (_, before, source, after) => `${before}about:blank${after} data-retrostream-watch-src="${source}"`,
  );
}

function checking(copy = 'Finding the best watch domain…', detail = 'Checking dohmwatch.com first, then backups if needed.') {
  return `<div class="watch-checking" role="status"><span class="loading loading-spinner"></span><div><strong>${copy}</strong><p>${detail}</p></div></div>`;
}

async function managePlayer(frame) {
  if (frame.dataset.watchManaged) return;
  frame.dataset.watchManaged = 'true';
  const original = frame.dataset.retrostreamWatchSrc;
  const details = parseLegacyPlayerUrl(original);
  if (!details) return;

  const note = frame.nextElementSibling?.classList.contains('player-note') ? frame.nextElementSibling : null;
  const region = document.createElement('div');
  region.className = 'watch-player-region';
  frame.before(region);
  frame.remove();
  note?.remove();
  let active = null;
  let run = 0;
  region.addEventListener('click', e => {
    const btn = e.target.closest('#retry-watch-domains, #reload-player, #switch-watch-domain');
    if (!btn) return;
    if (btn.id === 'retry-watch-domains') load(null);
    else if (btn.id === 'reload-player' && active) {
      const f = region.querySelector('.player');
      if (f) f.src = active.url;
    } else if (btn.id === 'switch-watch-domain') load(active?.index ?? null);
  });

  const load = async afterIndex => {
    const ticket = ++run;
    region.innerHTML = checking(
      afterIndex == null ? 'Finding the best watch domain…' : 'Trying another watch domain…',
      afterIndex == null ? 'Checking dohmwatch.com first, then backups if needed.' : 'Looking for the next available VidSrc backup.',
    );
    if (navigator.onLine === false) {
      region.innerHTML = '<div class="error-box watch-outage" role="alert"><h2>You\'re offline.</h2><p>Reconnect to the internet and try again. RetroStream will check dohmwatch.com first.</p><button class="btn btn-secondary" id="retry-watch-domains">Try again</button></div>';
      return;
    }
    const result = await resolveWatchDomain(details, { afterIndex });
    if (ticket !== run || !region.isConnected) return;
    if (!result) {
      active = null;
      region.innerHTML = '<div class="error-box watch-outage" role="alert"><h2>All watch domains are temporarily unavailable.</h2><p>Playback should be back shortly. Try again in a moment.</p><div class="actions watch-outage-actions"><button class="btn btn-primary" id="retry-watch-domains">Try again</button></div></div>';
      return;
    }
    active = result;
    const host = esc(new URL(result.domain).hostname);
    const fallback = result.index > 0 ? `<div class="watch-domain-status" role="status" aria-live="polite">${infoIcon}<div><strong>Backup watch domain active</strong><p>dohmwatch.com is temporarily unavailable, so RetroStream switched to <span>${host}</span>. You may notice a slightly worse ad experience while the backup is active.</p></div></div>` : '';
    region.innerHTML = `${fallback}<iframe class="player" data-watch-managed="true" src="${esc(result.url)}" title="RetroStream player" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="origin"></iframe><p class="player-note">Player not loading? <button class="link" id="reload-player">Reload player</button> or <button class="link" id="switch-watch-domain">try another watch domain</button>. Playback is powered by VidSrc and may include ads. Availability varies.</p>`;
    const liveFrame = region.querySelector('.player');
    liveFrame?.addEventListener('error', () => load(active?.index ?? null), { once: true });
  };

  await load(null);
}

export function installWatchPlayerEnhancer() {
  const main = document.querySelector('#main');
  if (!main) return;
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  if (descriptor?.get && descriptor?.set) {
    Object.defineProperty(main, 'innerHTML', {
      configurable: true,
      get() { return descriptor.get.call(this); },
      set(value) { return descriptor.set.call(this, rewriteLegacyPlayerMarkup(value)); },
    });
  }
  const upgrade = () => main.querySelectorAll('iframe.player[data-retrostream-watch-src]:not([data-watch-managed])').forEach(frame => managePlayer(frame));
  new MutationObserver(upgrade).observe(main, { childList: true, subtree: true });
  upgrade();
}

if (typeof document !== 'undefined') {
  installWatchPlayerEnhancer();
  import('./retrostream.js').catch(error => console.error('RetroStream failed to start', error));
}
