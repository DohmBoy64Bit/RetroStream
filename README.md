<div align="center">

# RetroStream

### Find your next great watch.

A cinema-inspired movie and TV browser with rich title details, effortless episode selection, and no application signup.

**HTML + Vanilla JavaScript · Vite · Tailwind CSS 4 · daisyUI 5 · Cloudflare Workers · TMDB**

</div>

---

## What RetroStream does

RetroStream is a lightweight streaming-style catalog interface for discovering movies and TV series, opening rich title details, browsing seasons and episodes, and embedding playback through VidSrc when an IMDb identifier is available.

There is no RetroStream account system. Open the site, find something to watch, pick a title or episode, and play it.

## Features

- **Discovery home:** trending titles, popular movies, popular TV series, and current theatrical releases.
- **Robust search:** search by title or IMDb ID, then filter loaded results by media type, genre, release year, and TMDB audience rating.
- **Netflix-style horizontal rows:** arrow paging, mouse dragging, touch swiping, keyboard navigation, and no visible horizontal scrollbars.
- **Rich title details:** backdrop art, poster art, synopsis, rating, genres, runtime, production information, cast, and crew.
- **TV episode browser:** season selection, episode artwork, descriptions, runtimes, air-date awareness, and next-episode navigation.
- **Playback integration:** movies and aired episodes resolve IMDb IDs through TMDB and use VidSrc embeds through `dohmwatch.com`, with automatic backup-domain failover.
- **Responsive design:** desktop, tablet, and mobile layouts with keyboard focus and reduced-motion support.
- **Server-side TMDB access:** the TMDB read token stays in the Cloudflare Worker environment and is never exposed in browser JavaScript.
- **Search-engine friendly navigation:** crawlable History API routes, route-specific titles/descriptions/canonicals, structured data, robots directives, and a generated sitemap.

## Architecture

RetroStream intentionally has one frontend renderer: **vanilla JavaScript owns the application DOM**. Vite serves and bundles the client, while a small Cloudflare Worker owns `/api/*` server concerns such as the TMDB proxy.

```text
Browser
  └─ Vite client
      ├─ index.html
      ├─ src/main.js
      ├─ RetroStream UI + History API routing
      └─ player/domain controller
             │
             └─ fetch /api/tmdb
                    │
                    ▼
              Cloudflare Worker
                    │
                    └─ TMDB API
```

There is no React hydration layer, no Next.js App Router, and no competing DOM owner.

## Stack

- HTML + vanilla JavaScript
- Vite 8
- Tailwind CSS 4
- daisyUI 5
- Cloudflare Vite plugin + Workers
- TMDB API
- VidSrc embeds

## Quick start

### Requirements

- Node.js **22.13+**
- pnpm **11.25.0**
- A TMDB **API Read Access Token**

Install pnpm if needed:

```bash
npm install --global pnpm@11.25.0
```

Clone and install:

```bash
git clone https://github.com/DohmBoy64Bit/RetroStream.git
cd RetroStream
pnpm install
```

### pnpm 11 build-script policy

pnpm 11 blocks dependency lifecycle scripts unless the project explicitly reviews them. RetroStream's `pnpm-workspace.yaml` allows only the reviewed build scripts required by this stack: `esbuild`, `sharp`, and `workerd`.

If you see `ERR_PNPM_IGNORED_BUILDS`, make sure `pnpm-workspace.yaml` is present and run `pnpm install` again. Do not enable all dependency build scripts globally.

### Local TMDB secret

Cloudflare's Vite integration loads Worker secrets from `.dev.vars` during local development. Copy the committed template:

**PowerShell**

```powershell
Copy-Item .dev.vars.example .dev.vars
```

**macOS / Linux**

```bash
cp .dev.vars.example .dev.vars
```

Then set:

```dotenv
TMDB_READ_TOKEN=your_tmdb_read_access_token
```

`.dev.vars` is ignored by Git. Never commit the real token.

Start RetroStream:

```bash
pnpm dev
```

Open the local URL printed by Vite. RetroStream requests port **5173**.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Vite + Cloudflare Worker development server on port 5173 |
| `pnpm build` | Build the browser assets and Worker deployment output |
| `pnpm preview` | Preview the latest production build through the Workers runtime |
| `pnpm deploy` | Build and deploy with Wrangler |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run `tsc --noEmit` |
| `pnpm check` | Run dependency-free syntax checks and regression tests |
| `pnpm test` | Run client bootstrap, Worker proxy, playback, and release-config tests |

## Project structure

```text
RetroStream/
├── index.html                 # semantic application shell; vanilla client owns its DOM
├── api/
│   ├── robots.js              # Vercel robots.txt endpoint
│   ├── sitemap.js             # Vercel sitemap endpoint
│   └── tmdb.js                # Vercel TMDB proxy adapter
├── public/
│   └── favicon.svg            # copied as a static asset
├── src/
│   ├── main.js                # browser entrypoint
│   ├── critical.css           # first-paint and route-loading stability
│   ├── styles.css             # Tailwind/daisyUI + RetroStream visual system
│   ├── watch-states.css       # playback fallback/outage states
│   └── app/
│       ├── carousels.js       # paging, dragging, keyboard controls
│       ├── retrostream.js     # discovery, search, details, episodes, clean URL routing
│       ├── routing.js         # crawlable URL builders + legacy hash migration
│       ├── seo.js             # route metadata, canonicals, social tags, JSON-LD
│       ├── watch-player.js    # resilient player controller and failover UX
│       └── watch-domains.js   # primary + backup VidSrc domain resolver
├── worker/
│   └── index.js               # allowlisted server-side TMDB proxy
├── tests/                     # bootstrap, Worker, playback, and release regressions
├── .dev.vars.example          # local Worker secret template
├── postcss.config.mjs         # Tailwind PostCSS integration used by Vite
├── package.json
├── pnpm-workspace.yaml        # pnpm 11 native build allowlist
├── tsconfig.json
├── vite.config.ts
└── wrangler.jsonc
```

Internal project/design state such as `.openai/`, `.impeccable/`, `PRODUCT.md`, and `DESIGN.md` is intentionally excluded from the public repository.


## Search engine optimization

RetroStream uses normal, crawlable URLs instead of fragment-only application routes:

- `/movies` — movie discovery
- `/series` — TV and series discovery
- `/new` — new and recent releases
- `/movie/:id/:slug` — movie details
- `/series/:id/:slug` — series details
- `/search` — catalog search (marked `noindex`)
- `/watch/*` — playback routes (marked `noindex`)

The client updates the document title, meta description, canonical URL, Open Graph/Twitter metadata, and JSON-LD when the route changes. Movie and series detail pages expose `Movie` or `TVSeries` structured data using the loaded TMDB metadata.

`/robots.txt` and `/sitemap.xml` are generated from the request origin so the same deployment works on Cloudflare, Vercel, preview domains, and custom domains without hard-coding a hostname. The sitemap always includes the main discovery pages and, when the TMDB token is available, also includes current popular movie and series detail URLs.

Legacy `#home`, `#browse/...`, `#title/...`, and `#watch/...` links are migrated in-place to their clean URL equivalents so old shared links keep working.

## How catalog requests work

The browser never contacts TMDB with your API token directly.

1. Browser code calls `/api/tmdb` with an allowlisted TMDB path and approved query parameters.
2. Cloudflare routes `/api/*` to `worker/index.js` before static-asset handling.
3. The Worker reads `TMDB_READ_TOKEN` from its environment.
4. The Worker calls TMDB with that token.
5. The browser receives metadata only.

The proxy rejects paths and query parameters outside RetroStream's expected catalog flows.

## How playback works

For movies and TV episodes, RetroStream asks TMDB for external IDs. If a valid IMDb ID is available, RetroStream builds the corresponding VidSrc embed URL and opens it in an iframe.

The preferred watch domain is **`https://dohmwatch.com`**. Before loading a player, RetroStream checks that domain first. If it cannot be reached, the site automatically tries these backups in order:

1. `vidsrc2.ru`
2. `vidsrc.ir`
3. `vidsrcme.ru`
4. `vidsrcme.su`
5. `vidsrc-me.ru`
6. `vidsrc-me.su`
7. `vidsrc-embed.ru`
8. `vidsrc-embed.su`
9. `vsrc.su`

When a backup is active, RetroStream explains that `dohmwatch.com` is temporarily unavailable and warns that the backup may have a slightly worse ad experience. If every watch domain is unreachable, the player becomes a temporary-outage state with a **Try again** action. Viewers can also choose **try another watch domain**.

The fallback choice is not persisted: every new playback starts with `dohmwatch.com` again.

A title appearing in TMDB does **not** guarantee that a stream exists. Availability depends on the external playback provider, title, and region. Embedded third-party players may also include advertising.

**Ratings displayed by RetroStream are TMDB audience ratings, not IMDb ratings.**

## Keyboard, mouse, and touch

- Press `/` when you are not typing to open search.
- Focus a horizontal row and use **Left / Right** to page through it.
- Use **Home / End** to move to the beginning or end of a row.
- Drag a row with the mouse.
- Swipe naturally on touch devices.
- Carousel arrows disappear or disable at the ends.
- Dragging suppresses the accidental click that would otherwise open a poster on pointer release.

## Cloudflare routing and deployment

`wrangler.jsonc` keeps static assets and backend concerns separate:

- Vite builds `index.html`, CSS, JavaScript, and `public/` assets.
- SPA fallback serves `index.html` for client navigation that does not match a file.
- `/api/*`, `/robots.txt`, and `/sitemap.xml` run the Worker first.
- `worker/index.js` handles `/api/tmdb`, `/robots.txt`, and `/sitemap.xml`; unrelated Worker-first paths return `404`.

For production, store the TMDB token as a Worker secret:

```bash
pnpm wrangler secret put TMDB_READ_TOKEN
```

Then deploy:

```bash
pnpm deploy
```

The Cloudflare Vite plugin generates the deployment-time Wrangler configuration from the production build.

## Verification

The repository includes regression coverage for:

- vanilla `index.html` as the single frontend shell
- absence of React/Next/Vinext runtime dependencies
- Vite + Cloudflare configuration
- Worker/API routing and TMDB allowlisting
- pnpm 11 native build policy
- watch-domain order and URL generation
- player interception and backup-domain behavior
- client bootstrap ownership so the hydration race cannot be reintroduced accidentally
- crawlable History API routes, SEO metadata, robots.txt, and sitemap generation

For a release candidate, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Credits

- [TMDB](https://www.themoviedb.org/) — movie, television, people, and image metadata. RetroStream uses the TMDB API but is not endorsed or certified by TMDB.
- [VidSrc](https://vidsrc2.ru/vidsrc/docs/) — external playback embeds.
- [Tailwind CSS](https://tailwindcss.com/) and [daisyUI](https://daisyui.com/) — styling foundations.
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) and [Vite](https://vite.dev/) — frontend build/runtime integration and backend API runtime.

Third-party services and assets remain subject to their respective terms and licenses.
