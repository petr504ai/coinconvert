import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Seo from './Seo';
import { getArticleBySlug } from '../data/articles';

export default function BlogPost() {
  const { slug } = useParams();
  const article = getArticleBySlug(slug);

  if (!article) {
    return (
      <div className="app-container">
        <Seo
          title="Статья не найдена"
          description="Запрошенная статья не найдена."
          canonicalPath={`/blog/${slug}`}
          robots="noindex,follow"
          ogType="website"
          ogImage="https://coinconvert.ru/logo_big.png"
        />
        <div className="form-container">
          <h2>Статья не найдена</h2>
          <p>Возможно, ссылка устарела.</p>
          <Link to="/blog">← К списку статей</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Seo
        title={article.title}
        description={article.description}
        canonicalPath={`/blog/${article.slug}`}
        ogType="article"
        ogImage="https://coinconvert.ru/logo_big.png"
      />

      <div className="app-header">
        <img src="/logo.png" alt="CoinConvert" className="logo" style={{ height: 'auto', marginBottom: '8px' }} />
        <p className="subtitle">{article.title}</p>
      </div>

      <div className="form-container">
        <small className="blog-meta">Дата: {article.date}</small>

        <div className="blog-content">
          {article.content.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        <div className="blog-nav">
          <Link to="/blog">← Все статьи</Link>
          <Link to="/">На главную</Link>
        </div>
      </div>
    </div>
  );
}
