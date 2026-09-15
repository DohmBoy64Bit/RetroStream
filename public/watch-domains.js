export const WATCH_DOMAINS = Object.freeze([
  'https://dohmwatch.com',
  'https://vidsrc2.ru',
  'https://vidsrc.ir',
  'https://vidsrcme.ru',
  'https://vidsrcme.su',
  'https://vidsrc-me.ru',
  'https://vidsrc-me.su',
  'https://vidsrc-embed.ru',
  'https://vidsrc-embed.su',
  'https://vsrc.su',
]);

export function buildWatchUrl(domain, type, imdb, season = 1, episode = 1) {
  const base = String(domain).replace(/\/$/, '');
  const suffix = type === 'tv' ? `/${Number(season)}/${Number(episode)}` : '';
  return `${base}/embed/${type}/${imdb}${suffix}?autoplay=0`;
}

export async function probeWatchUrl(url, { fetchImpl = fetch, timeoutMs = 1800 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetchImpl(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function domainOrder(afterIndex) {
  const indices = WATCH_DOMAINS.map((_, index) => index);
  if (!Number.isInteger(afterIndex) || afterIndex < 0 || afterIndex >= indices.length) return indices;
  return [...indices.slice(afterIndex + 1), ...indices.slice(0, afterIndex)];
}

export async function resolveWatchDomain(
  details,
  { afterIndex = null, probe = probeWatchUrl, batchSize = 3 } = {},
) {
  const order = domainOrder(afterIndex);
  const size = Math.max(1, Number(batchSize) || 1);
  const firstIndex = order.shift();

  if (firstIndex !== undefined) {
    const domain = WATCH_DOMAINS[firstIndex];
    const url = buildWatchUrl(domain, details.type, details.imdb, details.season, details.episode);
    if (await probe(url)) return { index: firstIndex, domain, url, reachable: true };
  }

  for (let offset = 0; offset < order.length; offset += size) {
    const batch = order.slice(offset, offset + size);
    const results = await Promise.all(
      batch.map(async index => {
        const domain = WATCH_DOMAINS[index];
        const url = buildWatchUrl(domain, details.type, details.imdb, details.season, details.episode);
        return { index, domain, url, reachable: await probe(url) };
      }),
    );
    const available = results.find(result => result.reachable);
    if (available) return available;
  }

  return null;
}
