import articlesJson from './articles.json';

export const articles = Array.isArray(articlesJson) ? articlesJson : [];

export function getArticleBySlug(slug) {
  return articles.find((a) => a.slug === slug);
}
