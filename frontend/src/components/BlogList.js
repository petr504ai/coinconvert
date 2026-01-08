import React from 'react';
import { Link } from 'react-router-dom';
import Seo from './Seo';
import { articles } from '../data/articles';

export default function BlogList() {
  return (
    <div className="app-container">
      <Seo
        title="Статьи"
        description="Статьи и новости про обмен USDT на рубли и обратно: практические инструкции, риски, тенденции P2P и регулирование."
        canonicalPath="/blog"
        ogType="website"
        ogImage="https://coinconvert.ru/logo_big.png"
      />

      <div className="app-header">
        <img src="/logo.png" alt="CoinConvert" className="logo" style={{ height: 'auto', marginBottom: '8px' }} />
        <p className="subtitle">Статьи и новости</p>
      </div>

      <div className="form-container">
        <p className="blog-intro">
          Пишем о том, как менять USDT на рубли и обратно, и что происходит на рынке P2P.
        </p>

        <div className="blog-list">
          {articles
            .slice()
            .sort((a, b) => (a.date < b.date ? 1 : -1))
            .map((a) => (
              <div key={a.slug} className="transaction-item">
                <strong>
                  <Link to={`/blog/${a.slug}`}>
                    {a.title}
                  </Link>
                </strong>
                <br />
                <small className="blog-card-desc">{a.description}</small>
                <br />
                <small className="blog-card-date">Дата: {a.date}</small>
              </div>
            ))}
        </div>

        <div className="blog-nav">
          <Link to="/">← На главную</Link>
        </div>
      </div>
    </div>
  );
}
