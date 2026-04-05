import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './About.module.css';

const FEATURES = [
  {
    icon: '⚡',
    title: 'Real-Time WebSocket Feed',
    desc: 'Prices stream live from our Go backend via WebSocket — no page refreshes, no polling delays. Data updates every 7 seconds from 9 exchanges simultaneously.',
  },
  {
    icon: '🏦',
    title: '9 Major Exchanges',
    desc: 'We aggregate from Binance, Coinbase, Kraken, Bitfinex, Bitstamp, Huobi, KuCoin, OKX and Gate.io — giving you the widest cross-exchange view available.',
  },
  {
    icon: '📊',
    title: 'Arbitrage Detection',
    desc: 'The ↑ and ↓ arrows on the dashboard instantly reveal which exchange has the highest and lowest price — spotting arbitrage opportunities at a glance.',
  },
  {
    icon: '🔐',
    title: 'Secure Authentication',
    desc: 'Passwords are hashed with bcrypt. Sessions use JWT tokens stored in localStorage with automatic expiry detection. Your data stays yours.',
  },
  {
    icon: '🗄️',
    title: 'Persistent PostgreSQL',
    desc: 'User accounts are stored in a PostgreSQL database running in Docker. Data survives restarts and is production-ready for deployment.',
  },
  {
    icon: '📈',
    title: '7-Day Price Charts',
    desc: 'Each coin detail page shows an SVG sparkline chart of the last 7 days with trend detection, high/low markers, and a gradient fill.',
  },
];

const EXCHANGES = [
  { name: 'Binance',   color: '#f3ba2f' },
  { name: 'Coinbase',  color: '#0052ff' },
  { name: 'Kraken',    color: '#5741d9' },
  { name: 'Bitfinex',  color: '#16b157' },
  { name: 'Bitstamp',  color: '#00aaee' },
  { name: 'Huobi',     color: '#1a56db' },
  { name: 'KuCoin',    color: '#23af91' },
  { name: 'OKX',       color: '#ffffff' },
  { name: 'Gate.io',   color: '#e74c3c' },
];

const STACK = [
  { label: 'Frontend',   items: ['React 18', 'TypeScript', 'Redux Toolkit', 'React Router'] },
  { label: 'Backend',    items: ['Go 1.23', 'WebSocket', 'RabbitMQ', 'REST API'] },
  { label: 'Database',   items: ['PostgreSQL 16', 'Docker', 'bcrypt', 'JWT'] },
  { label: 'Data',       items: ['Binance API', 'CoinGecko', 'Live WebSocket', '9 Exchanges'] },
];

const About = () => {
  const navigate = useNavigate();
  const cardsRef = useRef<HTMLDivElement[]>([]);

  // Intersection observer for scroll-triggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add(styles.visible);
      }),
      { threshold: 0.15 }
    );
    cardsRef.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addRef = (el: HTMLDivElement | null, i: number) => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>About the Platform</div>
          <h1 className={styles.heroTitle}>
            Built for crypto traders<br />
            <span className={styles.heroAccent}>who need the edge.</span>
          </h1>
          <p className={styles.heroDesc}>
            ExchangeGo is a real-time cryptocurrency price aggregator that pulls live data
            from 9 major exchanges simultaneously — giving you instant visibility into
            price differences, arbitrage gaps, and market movements across the board.
          </p>
          <div className={styles.heroBtns}>
            <button className={styles.heroPrimary} onClick={() => navigate('/')}>
              View Markets →
            </button>
            <button className={styles.heroSecondary} onClick={() => navigate(-1)}>
              ← Go Back
            </button>
          </div>
        </div>

        {/* Floating exchange pills */}
        <div className={styles.floatingPills}>
          {EXCHANGES.map((ex, i) => (
            <div
              key={ex.name}
              className={styles.pill}
              style={{
                '--pill-color': ex.color,
                animationDelay: `${i * 0.4}s`,
              } as React.CSSProperties}
            >
              <span className={styles.pillDot} style={{ background: ex.color }} />
              {ex.name}
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className={styles.statsBar} ref={el => addRef(el as HTMLDivElement, 0)}>
        {[
          { value: '9',    label: 'Exchanges'      },
          { value: '10',   label: 'Coins Tracked'  },
          { value: '7s',   label: 'Update Interval'},
          { value: '24/7', label: 'Live Data'       },
        ].map((s, i) => (
          <div key={i} className={styles.statItem}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── Features ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader} ref={el => addRef(el as HTMLDivElement, 1)}>
          <h2 className={styles.sectionTitle}>What makes it different</h2>
          <p className={styles.sectionSub}>Every feature was built with a real trader's workflow in mind.</p>
        </div>
        <div className={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`${styles.featureCard} ${styles.fadeInCard}`}
              ref={el => addRef(el as HTMLDivElement, i + 2)}
              style={{ '--delay': `${i * 0.08}s` } as React.CSSProperties}
            >
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Exchange list ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader} ref={el => addRef(el as HTMLDivElement, 10)}>
          <h2 className={styles.sectionTitle}>Exchanges we track</h2>
          <p className={styles.sectionSub}>Live price feeds from the world's most liquid crypto markets.</p>
        </div>
        <div className={styles.exchangeList}>
          {EXCHANGES.map((ex, i) => (
            <div key={i} className={styles.exchangeChip} ref={el => addRef(el as HTMLDivElement, 11 + i)}>
              <div className={styles.exchangeDot} style={{ background: ex.color }} />
              <span>{ex.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech stack ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader} ref={el => addRef(el as HTMLDivElement, 20)}>
          <h2 className={styles.sectionTitle}>Technology stack</h2>
          <p className={styles.sectionSub}>Modern, production-grade tools chosen for performance and reliability.</p>
        </div>
        <div className={styles.stackGrid}>
          {STACK.map((s, i) => (
            <div key={i} className={`${styles.stackCard} ${styles.fadeInCard}`} ref={el => addRef(el as HTMLDivElement, 21 + i)}>
              <h4 className={styles.stackCategory}>{s.label}</h4>
              <ul className={styles.stackList}>
                {s.items.map((item, j) => (
                  <li key={j} className={styles.stackItem}>
                    <span className={styles.stackDot} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.cta} ref={el => addRef(el as HTMLDivElement, 25)}>
        <h2 className={styles.ctaTitle}>Ready to track the markets?</h2>
        <p className={styles.ctaDesc}>Sign in and get live price data from 9 exchanges in one view.</p>
        <button className={styles.ctaBtn} onClick={() => navigate('/')}>
          Open Dashboard →
        </button>
      </section>

    </div>
  );
};

export default About;