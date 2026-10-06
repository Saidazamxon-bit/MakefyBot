import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useI18n } from '../i18n';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Bot,
  LayoutDashboard,
  Settings,
  Sparkles,
  WalletCards,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import HowItWorks from '../components/introduction/HowItWorks';
import ContainerScroll from '../components/ui/container-scroll-animation';
import './Login.css';

const BOT_LINK = 'https://t.me/Makefybot/app';

const bots = [
  { icon: 'M', name: 'Makefy Store', username: '@makefy_store_bot', status: 'Faol' },
  { icon: 'A', name: 'Auto Sales Bot', username: '@auto_sales_bot', status: 'Faol', accent: 'purple' },
  { icon: 'P', name: 'Promo Helper', username: '@promo_helper_bot', status: 'Faol', accent: 'orange' },
];

function TelegramMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="makefy-icon">
      <path fill="currentColor" d="M21.7 3.3 18.6 20c-.23 1.18-.86 1.47-1.74.92l-4.78-3.52-2.31 2.22c-.26.26-.48.48-.98.48l.35-4.87 8.86-8c.39-.35-.08-.55-.6-.2L6.44 13.8l-4.72-1.48c-1.03-.32-1.05-1.03.22-1.52L20.4 3.1c.87-.32 1.63.2 1.3.2Z" />
    </svg>
  );
}

function Arrow() {
  return <span className="makefy-arrow" aria-hidden="true">↗</span>;
}

export default function LandingPage() {
  const { status } = useAuth();
  const isLoggedIn = status === 'user' || status === 'admin';
  const { t, lang, pref, setPref } = useI18n();
  const [pub, setPub] = useState(null);
  const [pubErr, setPubErr] = useState(false);
  useEffect(() => { api.get('/public_stats.php').then(setPub).catch(() => setPubErr(true)); }, []);
  const fmt = (n) => Number(n || 0).toLocaleString('ru-RU');

  return (
    <main className="makefy-landing" id="home">
      <div className="makefy-login__background" aria-hidden="true">
        <div className="makefy-grid" />
        <div className="makefy-orb makefy-orb--one" />
        <div className="makefy-orb makefy-orb--two" />
      </div>

      <div className="makefy-login__shell makefy-landing__shell">
        <header className="makefy-header makefy-header--landing">
          <a className="makefy-brand" href={BOT_LINK} target="_blank" rel="noreferrer">
            <img
              src="/makefy-logo.png"
              alt=""
              className="makefy-brand__mark"
              onError={(event) => {
                if (event.currentTarget.src.endsWith('/makefy-logo.png')) {
                  event.currentTarget.src = '/makerbot-logo.png';
                }
              }}
            />
            <span className="makefy-brand__name">makefy<span>.</span></span>
          </a>

          <nav className="makefy-landing-nav" aria-label="Asosiy navigatsiya">
            <Link to="/docs" className="makefy-landing-nav__link makefy-landing-nav__link--ghost">{t('landing.docs')}</Link>
            <Link to="/status" className="makefy-landing-nav__link makefy-landing-nav__link--ghost">{t('landing.status')}</Link>
            <select aria-label={t('lang.label')} value={pref === 'auto' ? lang : pref} onChange={(e) => setPref(e.target.value)} className="makefy-landing-nav__link makefy-landing-nav__link--ghost" style={{ background: 'transparent' }}>
              <option value="uz">UZ</option><option value="ru">RU</option><option value="en">EN</option>
            </select>
            <Link to="/login" className="makefy-landing-nav__link makefy-landing-nav__link--ghost">Kirish</Link>
            <Link to="/register" className="makefy-landing-nav__link makefy-landing-nav__link--primary">Ro‘yxatdan o‘tish</Link>
            {isLoggedIn && <Link to="/dashboard" className="makefy-landing-nav__link">Dashboard</Link>}
          </nav>
        </header>

        <section className="makefy-hero makefy-hero--landing" id="home">
          <div className="makefy-hero__copy">
            <div className="makefy-eyebrow"><span className="makefy-eyebrow__dot" /> Telegram platforma</div>
            <h1>
              Barcha botlaringizni
              <br />
              <span>bitta joydan boshqaring</span>
            </h1>
            <p className="makefy-hero__description">
              Makefy yordamida botlarni yaratish, ularga xizmat ko‘rsatish va daromadni kuzatish bir joyda amalga oshiriladi.
              Hammasi Telegram ichida, silliq va qulay boshqaruv bilan.
            </p>

            <div className="makefy-actions">
              <a className="makefy-primary-landing" href={BOT_LINK} target="_blank" rel="noreferrer">
                <TelegramMark />
                Boshlash
                <Arrow />
              </a>
              <Link to="/register" className="makefy-secondary-landing">
                Ro‘yxatdan o‘tish <Arrow />
              </Link>
            </div>

            <div className="makefy-proof">
              <div className="makefy-proof__avatars" aria-hidden="true"><span>U</span><span>B</span><span>+</span></div>
              <span><strong>Hammasi tayyor.</strong> Barcha boshqaruvlar bir joyda.</span>
            </div>
          </div>

          <div className="makefy-hero__visual" aria-label="Makefy boshqaruv paneli ko‘rinishi">
            <div className="makefy-visual__halo" />

            <div className="makefy-float-card makefy-float-card--top">
              <span className="makefy-float-card__icon makefy-float-card__icon--green">
                <ArrowUpRight size={16} />
              </span>
              <span>
                <b>+24.8%</b>
                <small>bu oy o'sish</small>
              </span>
            </div>

            <div className="makefy-float-card makefy-float-card--bottom">
              <span className="makefy-float-card__icon makefy-float-card__icon--blue">
                <Sparkles size={16} />
              </span>
              <span>
                <b>12 ta bot</b>
                <small>faol loyihalar</small>
              </span>
            </div>

            <ContainerScroll className="makefy-container-scroll">
              <div className="makefy-dashboard">
                <div className="makefy-dashboard__topline">
                  <span className="makefy-window-dots"><i /><i /><i /></span>
                  <span className="makefy-dashboard__brand">makefy <em>workspace</em></span>
                  <span className="makefy-dashboard__avatar">S</span>
                </div>

                <div className="makefy-dashboard__body">
                  <div className="makefy-dashboard__welcome">
                    <span>makefy.uz</span>
                    <small>{t('landing.stats.bots')}: {pub ? fmt(pub.stats.bots) : '…'}</small>
                  </div>

                  <div className="makefy-stats">
                    <div className="makefy-stat makefy-stat--primary">
                      <small>{t('landing.stats.users')}</small>
                      <strong>{pub ? fmt(pub.stats.users) : '…'}</strong>
                      <span>{t('landing.stats.templates')}: {pub ? fmt(pub.stats.templates) : '…'}</span>
                    </div>
                    <div className="makefy-stat">
                      <small>{t('landing.stats.bots')}</small>
                      <strong>{pub ? fmt(pub.stats.bots) : '…'}</strong>
                      <span>makefy</span>
                    </div>
                  </div>

                  <div className="makefy-dashboard__section-head">
                    <b>Botlaringiz</b>
                    <span>Hammasini ko'rish →</span>
                  </div>

                  <div className="makefy-bot-list">
                    {bots.map((bot) => (
                      <div key={bot.name} className="makefy-bot-row">
                        <span className={`makefy-bot-logo ${bot.accent ? `makefy-bot-logo--${bot.accent}` : ''}`}>{bot.icon}</span>
                        <span>
                          <b>{bot.name}</b>
                          <small>{bot.username}</small>
                        </span>
                        <em><i /> {bot.status}</em>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="makefy-dashboard__bottom">
                  <span className="is-active"><LayoutDashboard size={14} /><small>Dashboard</small></span>
                  <span><Bot size={14} /><small>Botlar</small></span>
                  <span><WalletCards size={14} /><small>Balans</small></span>
                  <span><Settings size={14} /><small>Sozlamalar</small></span>
                </div>
              </div>
            </ContainerScroll>
          </div>
        </section>

        <section className="makefy-home-section" id="bot-types">
          <div className="makefy-home-section__header">
            <span className="makefy-home-section__eyebrow">BOT TURLARI</span>
            <h2>Har bir bot uchun tayyor va tez ishlaydigan model</h2>
          </div>

          <div className="makefy-home-cards">
            <div className="makefy-home-card">
              <span>🛒</span>
              <h3>Online do‘kon</h3>
              <p>Buyurtmalar, katalog va to‘lovlarni bitta botda boshqarish.</p>
            </div>
            <div className="makefy-home-card">
              <span>🎬</span>
              <h3>Kino va kontent</h3>
              <p>Premium obuna, media va foydalanuvchilar bilan ishlash.</p>
            </div>
            <div className="makefy-home-card">
              <span>📈</span>
              <h3>Lead va sales</h3>
              <p>Client opsiyasi, savat va avtomatlashtirilgan sarlavhalar.</p>
            </div>
          </div>
        </section>

        <section className="makefy-home-section" id="pricing">
          <div className="makefy-home-section__header">
            <span className="makefy-home-section__eyebrow">NARXLAR</span>
            <h2>Qulay boshlash va tez kengayish</h2>
          </div>

          <div className="makefy-pricing-grid">
            {pubErr && <p role="alert">{t('landing.pricing.error')}</p>}
            {!pub && !pubErr && [0, 1, 2].map((i) => <div key={i} className="makefy-pricing-card" aria-busy="true"><small>…</small></div>)}
            {pub && pub.plans.map((p, i) => (
              <div key={p.kalit} className={'makefy-pricing-card' + (i === 1 ? ' is-featured' : '')}>
                <small>{p.nomi}</small>
                <strong>{p.narxi > 0 ? `${fmt(p.narxi)} ${t('common.soum')}` : t('common.free')}{p.muddat_kun > 0 && <em> {t('landing.pricing.month', { days: p.muddat_kun })}</em>}</strong>
                {p.limits && (
                  <p>
                    {Number(p.limits.max_bots) > 0 ? t('landing.pricing.bots', { n: fmt(p.limits.max_bots) }) : t('landing.pricing.botsUnlimited')}
                    {Number(p.limits.monthly_messages) > 0 && <><br />{t('landing.pricing.messages', { n: fmt(p.limits.monthly_messages) })}</>}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="makefy-home-section" id="about">
          <div className="makefy-home-section__header">
            <span className="makefy-home-section__eyebrow">BIZ HAQIMIZDA</span>
            <h2>Telegram botlarni biznes uchun qulay va tez yaratish platformasi</h2>
          </div>
          <p className="makefy-home-section__text">
            Makefy — botlar, buyurtmalar, to‘lovlar va foydalanuvchilar bilan ishlash uchun zamonaviy ishlash vositasi.
          </p>
        </section>

        <section className="makefy-home-section" id="faq">
          <div className="makefy-home-section__header">
            <span className="makefy-home-section__eyebrow">FAQ</span>
            <h2>Tez-tez beriladigan savollar</h2>
          </div>
          <div className="makefy-faq-list">
            <div className="makefy-faq-item"><b>Botni qayerdan boshlash kerak?</b><p>Bir necha bosqichda ishlashni boshlashingiz mumkin.</p></div>
            <div className="makefy-faq-item"><b>Makefy uchun dasturchi kerakmi?</b><p>Yo‘q, bloklar va shablonlar orqali ishlash mumkin.</p></div>
            <div className="makefy-faq-item"><b>Botlarimni kuzatamanmi?</b><p>Ha, dashboard orqali balans, statisika va faoliyatni kuzatishingiz mumkin.</p></div>
          </div>
        </section>

        <section className="makefy-home-section makefy-home-section--support" id="support">
          <div className="makefy-home-support">
            <div>
              <span className="makefy-home-section__eyebrow">YORDAM</span>
              <h2>Yordamga muhtoj bo‘lsangiz, biz qo‘lidan kelgancha yo‘l ko‘rsatamiz.</h2>
            </div>
            <a href="https://t.me/Makefybot/app" target="_blank" rel="noreferrer" className="makefy-button-primary">Supportga murojaat</a>
          </div>
        </section>

        <HowItWorks />
      </div>
    </main>
  );
}
