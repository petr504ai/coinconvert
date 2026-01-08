import { useEffect } from 'react';

const DEFAULT_SITE_NAME = 'CoinConvert';
const DEFAULT_BASE_URL = 'https://coinconvert.ru';

function upsertMetaByName(name, content) {
  if (!name) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content ?? '');
}

function upsertMetaByProperty(property, content) {
  if (!property) return;
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content ?? '');
}

function setCanonicalUrl(url) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

function normalizeBaseUrl(baseUrl) {
  return (baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
}

export default function Seo({
  title,
  description,
  canonicalPath,
  robots,
  ogType,
  ogImage,
  baseUrl
}) {
  useEffect(() => {
    const siteBaseUrl = normalizeBaseUrl(baseUrl);
    const canonicalUrl = canonicalPath ? `${siteBaseUrl}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}` : siteBaseUrl;

    const fullTitle = title ? `${title} — ${DEFAULT_SITE_NAME}` : DEFAULT_SITE_NAME;
    document.title = fullTitle;

    if (description) {
      upsertMetaByName('description', description);
      upsertMetaByProperty('og:description', description);
    }

    if (robots) {
      upsertMetaByName('robots', robots);
    }

    setCanonicalUrl(canonicalUrl);

    upsertMetaByProperty('og:site_name', DEFAULT_SITE_NAME);
    upsertMetaByProperty('og:title', title || DEFAULT_SITE_NAME);
    upsertMetaByProperty('og:type', ogType || 'website');
    upsertMetaByProperty('og:url', canonicalUrl);

    if (ogImage) {
      upsertMetaByProperty('og:image', ogImage);
    }
  }, [title, description, canonicalPath, robots, ogType, ogImage, baseUrl]);

  return null;
}
