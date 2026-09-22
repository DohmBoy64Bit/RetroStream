import { handleSitemapRequest } from '../worker/index.js';

export async function GET(request) {
  return handleSitemapRequest(request, {
    TMDB_READ_TOKEN: process.env.TMDB_READ_TOKEN,
  });
}
