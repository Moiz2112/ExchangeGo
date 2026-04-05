import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { RootState } from '../store';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal/LoginModal';
import styles from './CoinDetail.module.css';

// Maps URL coinId → ticker symbol stored in Redux
const ID_TO_TICKER: Record<string, string> = {
  bitcoin:      'BTC',
  ethereum:     'ETH',
  cardano:      'ADA',
  solana:       'SOL',
  dogecoin:     'DOGE',
  ripple:       'XRP',
  polkadot:     'DOT',
  litecoin:     'LTC',
  'bitcoin-cash': 'BCH',
  chainlink:    'LINK',
};

const COIN_META: Record<string, { emoji: string; name: string; color: string }> = {
  BTC:  { emoji: '₿', name: 'Bitcoin',      color: '#f7931a' },
  ETH:  { emoji: 'Ξ', name: 'Ethereum',     color: '#627eea' },
  ADA:  { emoji: '₳', name: 'Cardano',      color: '#3cc8c8' },
  SOL:  { emoji: '◎', name: 'Solana',       color: '#9945ff' },
  DOGE: { emoji: 'Ð', name: 'Dogecoin',     color: '#c2a633' },
  XRP:  { emoji: '✕', name: 'XRP',          color: '#00aae4' },
  DOT:  { emoji: '●', name: 'Polkadot',     color: '#e6007a' },
  LTC:  { emoji: 'Ł', name: 'Litecoin',     color: '#bebebe' },
  BCH:  { emoji: '₿', name: 'Bitcoin Cash', color: '#8dc351' },
  LINK: { emoji: '⬡', name: 'Chainlink',    color: '#2a5ada' },
};

const EXCHANGE_URLS: Record<string, string> = {
  'Binance':          'https://www.binance.com',
  'Coinbase':         'https://www.coinbase.com',
  'Coinbase Exchange':'https://www.coinbase.com',
  'Kraken':           'https://www.kraken.com',
  'Bitfinex':         'https://www.bitfinex.com',
  'Bitstamp':         'https://www.bitstamp.net',
  'Huobi':            'https://www.huobi.com',
  'HTX':              'https://www.htx.com',
  'KuCoin':           'https://www.kucoin.com',
  'OKX':              'https://www.okx.com',
  'Gate.io':          'https://www.gate.io',
  'Kucoin':           'https://www.kucoin.com'
};

interface HistoricalPoint {
  time: string;
  price: number;
}

const CoinDetail = () => {
  const { coinId } = useParams<{ coinId: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // Map URL coinId → ticker → Redux data
  const rates = useSelector((state: RootState) => state.exchangeRates);
  const ticker = coinId ? ID_TO_TICKER[coinId] ?? coinId.toUpperCase() : '';
  const meta = COIN_META[ticker];
  const coinRates = rates[ticker] ?? {};
  const exchanges = Object.entries(coinRates);

  const [history, setHistory] = useState<HistoricalPoint[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Connecting to markets…');
  const [coinInfo, setCoinInfo] = useState<any>(null);

  // Page loader — 2 second animated sequence before showing content
  useEffect(() => {
    setPageLoading(true);
    setLoadingText('Connecting to markets…');
    const messages = [
      'Connecting to markets…',
      'Fetching exchange data…',
      'Loading price history…',
      'Almost ready…',
    ];
    let i = 0;
    const textInterval = setInterval(() => {
      i++;
      if (i < messages.length) setLoadingText(messages[i]);
    }, 500);
    const done = setTimeout(() => {
      clearInterval(textInterval);
      setPageLoading(false);
    }, 2000);
    return () => { clearInterval(textInterval); clearTimeout(done); };
  }, [coinId]);

  // Only fetch chart history + coin metadata (2 lightweight calls, not the full ticker data)
  useEffect(() => {
    if (!coinId) return;
    setLoadingChart(true);

    const fetchHistory = async () => {
      try {
        const histRes = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7&interval=daily`
        );
        const prices = histRes.data.prices as [number, number][];
        setHistory(
          prices.map(([ts, price]) => ({
            time: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price,
          }))
        );
      } catch (err) {
        console.error('Failed to load chart:', err);
      }

      // Small delay between calls to avoid rate limiting
      await new Promise(r => setTimeout(r, 800));

      try {
        const infoRes = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
        );
        setCoinInfo(infoRes.data);
      } catch (err) {
        console.error('Failed to load coin info:', err);
      }

      setLoadingChart(false);
    };

    fetchHistory();
  }, [coinId]);

  // SVG sparkline chart
  const renderChart = () => {
    if (!history.length) return null;
    const prices = history.map(h => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const W = 800, H = 200;
    const pts = history.map((h, i) => {
      const x = (i / (history.length - 1)) * W;
      const y = H - ((h.price - min) / range) * (H - 20) - 10;
      return `${x},${y}`;
    });
    const isPositive = history[history.length - 1].price >= history[0].price;
    const lineColor = isPositive ? '#3fb950' : '#f85149';
    const gradId = `grad-${coinId}`;

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.chartSvg} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,${H} ${pts.join(' ')} ${W},${H}`} fill={`url(#${gradId})`} />
        <polyline points={pts.join(' ')} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {history.map((h, i) => {
          const x = (i / (history.length - 1)) * W;
          const y = H - ((h.price - min) / range) * (H - 20) - 10;
          return <circle key={i} cx={x} cy={y} r="4" fill={lineColor} opacity="0.8" />;
        })}
      </svg>
    );
  };

  // Stats derived from Redux data — always available instantly
  const avgPrice = exchanges.length > 0
    ? exchanges.reduce((sum, [, d]) => sum + parseFloat(d.price), 0) / exchanges.length
    : 0;
  const highestExchange = exchanges.length > 0
    ? exchanges.reduce((best, curr) => parseFloat(curr[1].price) > parseFloat(best[1].price) ? curr : best)
    : null;
  const lowestExchange = exchanges.length > 0
    ? exchanges.reduce((best, curr) => parseFloat(curr[1].price) < parseFloat(best[1].price) ? curr : best)
    : null;
  const priceRange = highestExchange && lowestExchange
    ? parseFloat(highestExchange[1].price) - parseFloat(lowestExchange[1].price)
    : 0;

  /* ── Auth gate ── */
  if (!isLoggedIn) {
    return (
      <div className={styles.authGate}>
        <div className={styles.authCard}>
          <div className={styles.authIcon}>🔒</div>
          <h2 className={styles.authTitle}>Members Only</h2>
          <p className={styles.authDesc}>
            Sign in to view detailed coin analytics, exchange comparisons and 7-day price charts.
          </p>
          <button className={styles.authSignInBtn} onClick={() => setShowLogin(true)}>
            Sign In to Continue →
          </button>
          <button className={styles.authBackBtn} onClick={() => navigate('/')}>
            ← Back to Markets
          </button>
        </div>
        {showLogin && (
          <LoginModal
            onClose={() => setShowLogin(false)}
            message="Sign in to view detailed coin analytics."
          />
        )}
      </div>
    );
  }

  /* ── Page loader ── */
  if (pageLoading) {
    return (
      <div className={styles.pageLoader}>
        <div className={styles.loaderInner}>
          <div className={styles.loaderRing}>
            <div className={styles.loaderRingInner} />
          </div>
          <div className={styles.loaderCoin}>
            {meta?.emoji ?? '◎'}
          </div>
          <p className={styles.loaderText}>{loadingText}</p>
          <div className={styles.loaderDots}>
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      <div className={styles.topNav}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          ← All Assets
        </button>
        <Link to="/about" className={styles.aboutLink}>
          About this platform ↗
        </Link>
      </div>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroEmoji} style={{ color: meta?.color }}>
            {meta?.emoji ?? '◎'}
          </div>
          <div>
            <h1 className={styles.coinTitle}>{meta?.name ?? ticker}</h1>
            <span className={styles.coinTickerBadge}>
              {ticker}
            </span>
          </div>
        </div>

        <div className={styles.heroPriceBlock}>
          <span className={styles.heroPriceLabel}>Avg. Price</span>
          <span className={styles.heroPriceValue}>
            ${avgPrice > 0 ? avgPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
          </span>
          {coinInfo && (
            <span className={`${styles.heroPriceChange} ${(coinInfo.market_data?.price_change_percentage_24h ?? 0) >= 0 ? styles.positive : styles.negative}`}>
              {(coinInfo.market_data?.price_change_percentage_24h ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(coinInfo.market_data?.price_change_percentage_24h ?? 0).toFixed(2)}% (24h)
            </span>
          )}
        </div>

        {coinInfo && (
          <div className={styles.heroMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Market Cap Rank</span>
              <span className={styles.metaValue}>#{coinInfo.market_cap_rank}</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats row — from Redux, shown instantly */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Avg. Price</span>
          <span className={styles.statValue}>
            ${avgPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Highest Exchange</span>
          <span className={styles.statValue}>
            {highestExchange ? (
              <>
                <span className={styles.positive}>
                  ${Number(highestExchange[1].price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className={styles.statSub}>{highestExchange[0]}</span>
              </>
            ) : '—'}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Lowest Exchange</span>
          <span className={styles.statValue}>
            {lowestExchange ? (
              <>
                <span className={styles.negative}>
                  ${Number(lowestExchange[1].price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className={styles.statSub}>{lowestExchange[0]}</span>
              </>
            ) : '—'}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Price Spread</span>
          <span className={styles.statValue}>
            ${priceRange.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* 7-day chart */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>7-Day Price History</h2>
        <div className={styles.chartContainer}>
          {loadingChart ? (
            <div className={styles.chartLoading}>
              <div className={styles.chartSpinner} />
              Loading chart…
            </div>
          ) : history.length > 0 ? (
            <>
              {renderChart()}
              <div className={styles.chartLabels}>
                {history.map((h, i) => (
                  <span key={i} className={styles.chartLabel}>{h.time}</span>
                ))}
              </div>
            </>
          ) : (
            <p className={styles.chartLoading}>Chart data unavailable</p>
          )}
        </div>
      </div>

      {/* Exchange prices — animated live ranking */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Exchange Comparison</h2>
        {exchanges.length > 0 ? (() => {
          const CARD_H = 72;   // card height px
          const GAP    = 10;   // gap between cards px

          const sorted = [...exchanges]
         .filter(([, d]) => Number(d.price) > 0 && d.price !== '' && d.price !== '0')
         .sort((a, b) => Number(b[1].price) - Number(a[1].price));

          const totalH = sorted.length * CARD_H + (sorted.length - 1) * GAP;

          return (
            <div className={styles.rankList} style={{ height: totalH }}>
              {sorted.map(([exchange, data], idx) => {
                const price = Number(data.price);
                const diff  = avgPrice > 0 ? ((price - avgPrice) / avgPrice) * 100 : 0;
                const isTop = idx === 0;
                const isBot = idx === sorted.length - 1;
                const topPx = idx * (CARD_H + GAP);

                return (
                  <div
                    key={exchange}
                    className={`${styles.rankItem} ${isTop ? styles.rankTop : isBot ? styles.rankBot : ''}`}
                    style={{ top: topPx }}
                  >
                    {/* Rank number */}
                    <div className={`${styles.rankNum} ${isTop ? styles.rankNumTop : ''}`}>
                      #{idx + 1}
                    </div>

                    {/* Exchange info */}
                    <div className={styles.rankExInfo}>
                    {EXCHANGE_URLS[exchange] ? (
  
   <a href={EXCHANGE_URLS[exchange]}
    target="_blank"
    rel="noopener noreferrer"
    className={styles.rankExLink}
    onClick={e => e.stopPropagation()}
  >
    {exchange}
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 4, opacity: 0.5, flexShrink: 0 }}>
      <path d="M2 10L10 2M10 2H5M10 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </a>
) : (
  <span className={styles.rankExName}>{exchange}</span>
)}
                      {isTop && (
                        <span className={styles.rankBadge} style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid var(--green)' }}>
                          ↑ Highest
                        </span>
                      )}
                      {isBot && sorted.length > 1 && (
                        <span className={styles.rankBadge} style={{ background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red)' }}>
                          ↓ Lowest
                        </span>
                      )}
                    </div>

                    {/* Price + diff */}
                    <div className={styles.rankPriceBlock}>
                     <span className={`${styles.rankPrice} ${isTop ? styles.positive : isBot && sorted.length > 1 ? styles.negative : ''}`}>
  {price > 0
    ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Waiting for data…</span>
  }
</span>
                      <span className={`${styles.rankDiff} ${diff >= 0 ? styles.positive : styles.negative}`}>
                        {diff >= 0 ? '+' : ''}{diff.toFixed(3)}% vs avg
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })() : (
          <p className={styles.noData}>
            No exchange data yet — go back and wait for prices to load.
          </p>
        )}
      </div>

    </div>
  );
};

export default CoinDetail;