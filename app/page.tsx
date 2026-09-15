export default function Home() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="masthead">
        <a href="#home" className="brand" aria-label="RetroStream home">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <rect x="2" y="5" width="28" height="22" rx="6" />
            <path d="m13 10 10 6-10 6z" />
          </svg>
          retro<span>stream</span><i />
        </a>
        <nav aria-label="Main navigation">
          <a href="#home" data-nav="home">Discover</a>
          <a href="#browse/movie" data-nav="movie">Movies</a>
          <a href="#browse/tv" data-nav="tv">TV &amp; series</a>
          <a href="#latest" data-nav="latest">Latest</a>
        </nav>
        <button className="search-launch btn btn-ghost" id="search-launch" aria-label="Search movies and series">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
          <span>Find your next watch</span>
          <kbd>/</kbd>
        </button>
      </header>
      <main id="main" tabIndex={-1}>
        <div className="loading-screen">
          <span className="loading loading-spinner" /> Opening the collection…
        </div>
      </main>
      <footer>
        <a className="brand footer-brand" href="#home">retro<span>stream</span><i /></a>
        <p>No accounts. Just something good to watch.</p>
        <small>
          This product uses the TMDB API but is not endorsed or certified by TMDB.<br />
          Metadata and ratings: <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer">TMDB</a>. Playback powered by VidSrc through the RetroStream watch-domain network; availability varies by title and region.
        </small>
      </footer>
      <script type="module" src="/watch-player.js" />
    </>
  );
}
