<div align="center">

# RetroStream

### Find your next great watch.

A cinema-inspired movie and TV browser with rich title details, effortless episode selection, and no application signup.

**HTML + Vanilla JavaScript · Tailwind CSS 4 · daisyUI 5 · TMDB**

</div>

---

## What RetroStream does

RetroStream is a lightweight streaming-style catalog interface for discovering movies and TV series, opening rich title details, browsing seasons and episodes, and embedding playback through VidSrc when an IMDb identifier is available.

There is no RetroStream account system. The UI is intentionally simple: open the site, find something to watch, pick a title or episode, and play it.

## Features

- **Discovery home:** trending titles, popular movies, popular TV series, and current theatrical releases.
- **Robust search:** search by title or IMDb ID, then filter loaded results by media type, genre, release year, and TMDB audience rating.
- **Netflix-style horizontal rows:** arrow paging, mouse dragging, touch swiping, keyboard navigation, and no visible horizontal scrollbars.
- **Rich title details:** backdrop art, poster art, synopsis, rating, genres, runtime, production information, cast, and crew.
- **TV episode browser:** season selection, episode artwork, descriptions, runtimes, air-date awareness, and next-episode navigation.
- **Playback integration:** movies and aired episodes resolve IMDb IDs through TMDB and use VidSrc embeds through `dohmwatch.com`, with automatic backup-domain failover.
- **Responsive design:** desktop, tablet, and mobile layouts with keyboard focus and reduced-motion support.
- **Server-side TMDB access:** the TMDB read token stays in the Worker environment and is never exposed in browser JavaScript.

## Stack

RetroStream's product UI is **HTML and vanilla JavaScript**. Vinext and the Cloudflare Vite plugin provide the Worker/App Router runtime used to host the HTML shell and the `/api/tmdb` proxy.

- HTML + vanilla JavaScript
- Tailwind CSS 4
- daisyUI 5
- Vinext / Vite
- Cloudflare Workers
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

Clone the repository and install dependencies:

```bash
git clone https://github.com/DohmBoy64Bit/RetroStream.git
cd RetroStream
pnpm install
```

Copy the environment template:

**PowerShell**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux**

```bash
cp .env.example .env
```

Add your TMDB read token:

```dotenv
TMDB_READ_TOKEN=your_tmdb_read_access_token
```

Cloudflare's local runtime supports both `.env` and `.dev.vars`; use one or the other. Both are ignored by Git.

Start RetroStream:

```bash
pnpm dev
```

Open the local URL printed by Vinext. The project requests port **5173**.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Compile RetroStream CSS and start the Vinext development server |
| `pnpm build` | Compile CSS and create the production Vinext/Cloudflare build |
| `pnpm lint` | Run ESLint |
| `pnpm check` | Run dependency-free syntax checks and watch-domain failover tests |
| `pnpm test` | Run watch-domain and player-controller tests |
| `node scripts/build-css.mjs` | Rebuild `public/retrostream.css` from `src/styles.css` |

## Project structure

```text
RetroStream/
├── app/
│   ├── api/tmdb/route.js     # allowlisted server-side TMDB proxy
│   ├── layout.tsx            # minimal App Router layout
│   └── route.js              # serves the RetroStream HTML document
├── public/
│   ├── carousels.js          # paging, dragging, keyboard controls
│   ├── favicon.svg
│   ├── retrostream.js        # discovery, search, details, and episode flows
│   ├── watch-player.js       # resilient player controller and failover UX
│   ├── watch-domains.js      # primary + backup VidSrc watch-domain resolver
│   └── watch-states.css      # fallback/outage player states
├── scripts/
│   └── build-css.mjs         # Tailwind/daisyUI compiler
├── src/
│   ├── shell.js              # semantic HTML shell/navigation
│   └── styles.css            # RetroStream visual system and responsive CSS
├── .env.example
├── package.json
├── vite.config.ts
└── wrangler.jsonc
```

Internal project/design state such as `.openai/`, `.impeccable/`, `PRODUCT.md`, and `DESIGN.md` is intentionally excluded from the public repository.

## How catalog requests work

The browser never contacts TMDB with your API token directly.

1. Browser code calls `/api/tmdb` with an allowlisted TMDB path and approved query parameters.
2. The Worker reads `TMDB_READ_TOKEN` from its environment.
3. The Worker calls TMDB with that token.
4. The browser receives metadata only.

The proxy rejects paths and query parameters that are outside RetroStream's expected catalog flows.

## How playback works

For movies and TV episodes, RetroStream asks TMDB for external IDs. If a valid IMDb ID is available, RetroStream builds the corresponding VidSrc embed URL and opens it in an iframe.

The preferred watch domain is **`https://dohmwatch.com`**. Before loading a player, RetroStream checks that domain first. If it cannot be reached, the site automatically works through the VidSrc backup network in this order:

1. `vidsrc2.ru`
2. `vidsrc.ir`
3. `vidsrcme.ru`
4. `vidsrcme.su`
5. `vidsrc-me.ru`
6. `vidsrc-me.su`
7. `vidsrc-embed.ru`
8. `vidsrc-embed.su`
9. `vsrc.su`

When a backup is active, the player page tells the viewer that `dohmwatch.com` is temporarily unavailable and warns that the backup may have a slightly worse ad experience. If every watch domain is unreachable, RetroStream replaces the broken player with a clear temporary-outage message and a **Try again** action. The player also exposes **try another watch domain** for provider failures that a cross-origin iframe cannot report reliably to its parent page.

The fallback choice is not persisted: every new playback request starts with `dohmwatch.com` again, so the primary domain automatically becomes preferred as soon as it is reachable.

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

## Production deployment

RetroStream targets Cloudflare Workers. Set `TMDB_READ_TOKEN` as a production Worker secret rather than committing it to a file.

The current Vinext Cloudflare workflow supports deployment through `@vinext/cloudflare` after the Worker configuration is in place. See the Vinext and Cloudflare Workers documentation for authentication and deployment commands appropriate to your account.

## Verification notes

The recovered source has been checked with:

- Node JavaScript syntax parsing across the application files
- JSON/configuration parsing
- secret scanning for accidentally committed TMDB values
- repository hygiene checks for private design/tool state
- regression checks ensuring CSS is built before local development starts
- regression checks ensuring required Cloudflare Worker types are declared
- watch-domain order, URL generation, player interception, and fallback-controller tests

A full `pnpm build` could not be rerun in the recovery sandbox because that environment could not reach the npm registry. Run `pnpm install` followed by `pnpm build` in a network-enabled environment before production deployment.

## Credits

- [TMDB](https://www.themoviedb.org/) — movie, television, people, and image metadata. RetroStream uses the TMDB API but is not endorsed or certified by TMDB.
- [VidSrc](https://vidsrc2.ru/vidsrc/docs/) — external playback embeds.
- [Tailwind CSS](https://tailwindcss.com/) and [daisyUI](https://daisyui.com/) — styling foundations.
- [Vinext](https://vinext.io/) and [Cloudflare Workers](https://developers.cloudflare.com/workers/) — application/runtime tooling.

Third-party services and assets remain subject to their respective terms and licenses.
