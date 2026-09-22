export const SITE_NAME = 'RetroStream';
export const DEFAULT_DESCRIPTION = 'Discover movies and TV series, explore cast and crew, browse episodes, and find your next great watch on RetroStream.';
export const DEFAULT_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

function absoluteSiteUrl(path = '/') {
  return new URL(path, window.location.origin).href;
}

export function cleanDescription(value, max = 160) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const clipped = text.slice(0, max - 1).replace(/\s+\S*$/, '').trim();
  return `${clipped || text.slice(0, max - 1)}…`;
}

function upsertMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.setAttribute('content', content);
}

function removeMeta(attribute, key) {
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove();
}

function setCanonical(path) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.append(element);
  }
  element.href = absoluteSiteUrl(path);
  return element.href;
}

function setJsonLd(schema) {
  let element = document.getElementById('route-jsonld');
  if (!schema) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement('script');
    element.id = 'route-jsonld';
    element.type = 'application/ld+json';
    document.head.append(element);
  }
  element.textContent = JSON.stringify(schema);
}

export function setPageSeo({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = window.location.pathname,
  robots = DEFAULT_ROBOTS,
  image = '',
  imageAlt = '',
  type = 'website',
  schema = null,
}) {
  const finalTitle = title || SITE_NAME;
  const finalDescription = cleanDescription(description);
  const canonical = setCanonical(canonicalPath);

  document.title = finalTitle;
  upsertMeta('name', 'description', finalDescription);
  upsertMeta('name', 'robots', robots);
  upsertMeta('property', 'og:site_name', SITE_NAME);
  upsertMeta('property', 'og:locale', 'en_US');
  upsertMeta('property', 'og:title', finalTitle);
  upsertMeta('property', 'og:description', finalDescription);
  upsertMeta('property', 'og:type', type);
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('name', 'twitter:title', finalTitle);
  upsertMeta('name', 'twitter:description', finalDescription);
  upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');

  if (image) {
    upsertMeta('property', 'og:image', image);
    upsertMeta('name', 'twitter:image', image);
    if (imageAlt) {
      upsertMeta('property', 'og:image:alt', imageAlt);
      upsertMeta('name', 'twitter:image:alt', imageAlt);
    }
  } else {
    removeMeta('property', 'og:image');
    removeMeta('property', 'og:image:alt');
    removeMeta('name', 'twitter:image');
    removeMeta('name', 'twitter:image:alt');
  }

  setJsonLd(schema);
}

export function webSiteSchema(description = DEFAULT_DESCRIPTION) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absoluteSiteUrl('/'),
    description: cleanDescription(description, 300),
  };
}

export function collectionSchema(name, description, path) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: absoluteSiteUrl(path),
    description: cleanDescription(description, 300),
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: absoluteSiteUrl('/'),
    },
  };
}

export function mediaSchema(media, mediaType, canonicalPath, imageUrl = '') {
  const isTv = mediaType === 'tv';
  const title = media.title || media.name || 'Untitled';
  const cast = (media.credits?.cast || []).slice(0, 12).map(person => ({
    '@type': 'Person',
    name: person.name,
  }));
  const directors = (media.credits?.crew || []).filter(person => person.job === 'Director').slice(0, 4).map(person => ({
    '@type': 'Person',
    name: person.name,
  }));
  const creators = (media.created_by || []).slice(0, 6).map(person => ({
    '@type': 'Person',
    name: person.name,
  }));
  const sameAs = [`https://www.themoviedb.org/${isTv ? 'tv' : 'movie'}/${media.id}`];
  const imdb = media.imdb_id || media.external_ids?.imdb_id;
  if (imdb && /^tt\d+$/.test(imdb)) sameAs.push(`https://www.imdb.com/title/${imdb}/`);

  const schema = {
    '@context': 'https://schema.org',
    '@type': isTv ? 'TVSeries' : 'Movie',
    name: title,
    url: absoluteSiteUrl(canonicalPath),
    description: cleanDescription(media.overview || '', 500),
    image: imageUrl || undefined,
    datePublished: media.release_date || media.first_air_date || undefined,
    genre: media.genres?.map(genre => genre.name),
    actor: cast.length ? cast : undefined,
    sameAs,
  };

  if (media.vote_count > 0 && Number.isFinite(Number(media.vote_average))) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(media.vote_average).toFixed(1),
      bestRating: 10,
      worstRating: 0,
      ratingCount: Number(media.vote_count),
    };
  }

  if (isTv) {
    schema.creator = creators.length ? creators : undefined;
    schema.numberOfSeasons = media.number_of_seasons || undefined;
    schema.numberOfEpisodes = media.number_of_episodes || undefined;
  } else {
    schema.director = directors.length ? directors : undefined;
    if (media.runtime) schema.duration = `PT${Number(media.runtime)}M`;
  }

  return schema;
}
