import { env } from 'cloudflare:workers';
export async function GET(request) {
 const q = new URL(request.url).searchParams; const path=q.get('path')||'';
 if(!/^(configuration|trending\/(movie|tv|all)\/(day|week)|genre\/(movie|tv)\/list|discover\/(movie|tv)|search\/(multi|movie|tv)|find\/tt\d+|(movie|tv)\/(popular|top_rated|now_playing|on_the_air|\d+(\/(external_ids|credits|season\/\d+))?))$/.test(path)) return Response.json({error:'Invalid request'},{status:400});
 const token=env.TMDB_READ_TOKEN;
 if(!token) return Response.json({error:'The movie catalog is not configured.'},{status:503});
 const url=new URL('https://api.themoviedb.org/3/'+path);
 const allowed=['query','page','with_genres','primary_release_year','first_air_date_year','vote_average.gte','sort_by','external_source','append_to_response','vote_count.gte','primary_release_date.lte','first_air_date.lte'];
 for(const k of allowed) if(q.has(k))url.searchParams.set(k,q.get(k));
 url.searchParams.set('include_adult','false');url.searchParams.set('language','en-US');
 try { const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(12000)}); if(!r.ok)return Response.json({error:r.status===429?'The catalog is busy. Please try again shortly.':'The catalog could not load. Please try again.'},{status:r.status===429?429:502}); return new Response(await r.text(),{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=120'}}); } catch {return Response.json({error:'Unable to reach the catalog. Please try again.'},{status:502});}
}
