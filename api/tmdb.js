import { handleTmdbRequest } from '../worker/index.js';

export async function GET(request) {
    return handleTmdbRequest(request, {
        TMDB_READ_TOKEN: process.env.TMDB_READ_TOKEN,
    });
}
