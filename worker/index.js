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
    if (url.pathname !== '/api/tmdb') {
      return new Response('Not Found', { status: 404 });
    }
    return handleTmdbRequest(request, env);
  },
};

export default worker;
