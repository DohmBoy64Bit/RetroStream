// @ts-check

/** @typedef {{ TMDB_READ_TOKEN?: string }} Env */
/** @typedef {(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>} FetchLike */

const TMDB_PATH = /^(configuration|trending\/(movie|tv|all)\/(day|week)|genre\/(movie|tv)\/list|discover\/(movie|tv)|search\/(multi|movie|tv)|find\/tt\d+|(movie|tv)\/(popular|top_rated|now_playing|on_the_air|\d+(\/(external_ids|credits|season\/\d+))?))$/;
const ALLOWED_PARAMS = [
  'query',
  'page',
  'with_genres',
  'primary_release_year',
  'first_air_date_year',
  'vote_average.gte',
  'sort_by',
  'external_source',
  'append_to_response',
  'vote_count.gte',
  'primary_release_date.lte',
  'first_air_date.lte',
];

const SITEMAP_STATIC_PATHS = ['/', '/movies', '/series', '/new'];

function seoSlug(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function handleRobotsRequest(request) {
  const origin = new URL(request.url).origin;
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

async function fetchSitemapCollection(path, token, fetchImpl) {
  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('language', 'en-US');
  url.searchParams.set('page', '1');
  const response = await fetchImpl(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data.results) ? data.results : [];
}

export async function handleSitemapRequest(request, env, fetchImpl = fetch) {
  const origin = new URL(request.url).origin;
  const paths = [...SITEMAP_STATIC_PATHS];
  const token = env.TMDB_READ_TOKEN;

  if (token) {
    try {
      const [movies, series] = await Promise.all([
        fetchSitemapCollection('movie/popular', token, fetchImpl),
        fetchSitemapCollection('tv/popular', token, fetchImpl),
      ]);
      for (const movie of movies) {
        if (!movie?.id || movie.adult) continue;
        const slug = seoSlug(movie.title);
        paths.push(`/movie/${movie.id}${slug ? `/${slug}` : ''}`);
      }
      for (const show of series) {
        if (!show?.id || show.adult) continue;
        const slug = seoSlug(show.name);
        paths.push(`/series/${show.id}${slug ? `/${slug}` : ''}`);
      }
    } catch {
      // Static discovery routes still produce a valid sitemap if TMDB is unavailable.
    }
  }

  const urls = [...new Set(paths)].map(path => `  <url><loc>${xmlEscape(new URL(path, origin).href)}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}

/**
 * Proxy one validated TMDB request while keeping the read token server-side.
 * @param {Request} request
 * @param {Env} env
 * @param {FetchLike} [fetchImpl]
 * @returns {Promise<Response>}
 */
export async function handleTmdbRequest(request, env, fetchImpl = fetch) {
  const query = new URL(request.url).searchParams;
  const path = query.get('path') ?? '';

  if (!TMDB_PATH.test(path)) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const token = env.TMDB_READ_TOKEN;
  if (!token) {
    return Response.json({ error: 'The movie catalog is not configured.' }, { status: 503 });
  }

  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  for (const key of ALLOWED_PARAMS) {
    const value = query.get(key);
    if (value !== null) url.searchParams.set(key, value);
  }
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('language', 'en-US');

  try {
    const response = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      return Response.json(
        {
          error: response.status === 429
            ? 'The catalog is busy. Please try again shortly.'
            : 'The catalog could not load. Please try again.',
        },
        { status: response.status === 429 ? 429 : 502 },
      );
    }

    return new Response(await response.text(), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120',
      },
    });
  } catch {
    return Response.json({ error: 'Unable to reach the catalog. Please try again.' }, { status: 502 });
  }
}

/** @type {ExportedHandler<Env>} */
const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/robots.txt') return handleRobotsRequest(request);
    if (url.pathname === '/sitemap.xml') return handleSitemapRequest(request, env);
    if (url.pathname === '/api/tmdb') return handleTmdbRequest(request, env);
    return new Response('Not Found', { status: 404 });
  },
};

export default worker;
