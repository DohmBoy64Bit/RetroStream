export function slugify(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function browsePath(type) {
  return type === 'tv' ? '/series' : '/movies';
}

export function titlePath(type, id, label = '') {
  const segment = type === 'tv' ? 'series' : 'movie';
  const slug = slugify(label);
  return `/${segment}/${id}${slug ? `/${slug}` : ''}`;
}

export function watchPath(type, id, season = 1, episode = 1) {
  if (type === 'tv') return `/watch/tv/${id}/${Number(season) || 1}/${Number(episode) || 1}`;
  return `/watch/movie/${id}`;
}

export function withParams(path, params) {
  const query = params instanceof URLSearchParams ? params : new URLSearchParams(params);
  const value = query.toString();
  return value ? `${path}?${value}` : path;
}

export function parseRoute(pathname = '/', search = '') {
  const path = (pathname || '/').replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
  const params = new URLSearchParams(search);

  if (path === '/') return { parts: ['home'], params };
  if (path === '/movies') return { parts: ['browse', 'movie'], params };
  if (path === '/series') return { parts: ['browse', 'tv'], params };
  if (path === '/new') return { parts: ['latest'], params };
  if (path === '/search') return { parts: ['search'], params };

  let match = path.match(/^\/movie\/(\d+)(?:\/[^/]+)?$/);
  if (match) return { parts: ['title', 'movie', match[1]], params };

  match = path.match(/^\/series\/(\d+)(?:\/[^/]+)?$/);
  if (match) return { parts: ['title', 'tv', match[1]], params };

  match = path.match(/^\/watch\/(movie|tv)\/(\d+)(?:\/(\d+))?(?:\/(\d+))?$/);
  if (match) return { parts: ['watch', match[1], match[2], match[3] || '1', match[4] || '1'], params };

  return { parts: null, params };
}

export function legacyHashToUrl(hash = '') {
  const value = String(hash).replace(/^#/, '');
  if (!value) return null;
  const separator = value.indexOf('?');
  const raw = separator >= 0 ? value.slice(0, separator) : value;
  const query = separator >= 0 ? value.slice(separator + 1) : '';
  const parts = raw.split('/').filter(Boolean);

  let path = null;
  if (parts[0] === 'home') path = '/';
  else if (parts[0] === 'browse' && parts[1] === 'movie') path = '/movies';
  else if (parts[0] === 'browse' && parts[1] === 'tv') path = '/series';
  else if (parts[0] === 'latest') path = '/new';
  else if (parts[0] === 'search') path = '/search';
  else if (parts[0] === 'title' && ['movie', 'tv'].includes(parts[1]) && /^\d+$/.test(parts[2] || '')) {
    path = titlePath(parts[1], parts[2]);
  } else if (parts[0] === 'watch' && ['movie', 'tv'].includes(parts[1]) && /^\d+$/.test(parts[2] || '')) {
    path = watchPath(parts[1], parts[2], parts[3], parts[4]);
  }

  return path ? `${path}${query ? `?${query}` : ''}` : null;
}
