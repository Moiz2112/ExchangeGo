import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { RootState } from '../store';
import styles from './Home.module.css';

const COIN_META: Record<string, { emoji: string; name: string; color: string; bg: string; id: string }> = {
  BTC:  { emoji: '₿', name: 'Bitcoin',     color: '#f7931a', bg: 'rgba(247,147,26,0.12)',  id: 'bitcoin' },
  ETH:  { emoji: 'Ξ', name: 'Ethereum',    color: '#627eea', bg: 'rgba(98,126,234,0.12)',  id: 'ethereum' },
  ADA:  { emoji: '₳', name: 'Cardano',     color: '#3cc8c8', bg: 'rgba(60,200,200,0.12)',  id: 'cardano' },
  SOL:  { emoji: '◎', name: 'Solana',      color: '#9945ff', bg: 'rgba(153,69,255,0.12)',  id: 'solana' },
  DOGE: { emoji: 'Ð', name: 'Dogecoin',    color: '#c2a633', bg: 'rgba(194,166,51,0.12)',  id: 'dogecoin' },
  XRP:  { emoji: '✕', name: 'XRP',         color: '#00aae4', bg: 'rgba(0,170,228,0.12)',   id: 'ripple' },
  DOT:  { emoji: '●', name: 'Polkadot',    color: '#e6007a', bg: 'rgba(230,0,122,0.12)',   id: 'polkadot' },
  LTC:  { emoji: 'Ł', name: 'Litecoin',    color: '#bebebe', bg: 'rgba(190,190,190,0.12)', id: 'litecoin' },
  BCH:  { emoji: '₿', name: 'Bitcoin Cash',color: '#8dc351', bg: 'rgba(141,195,81,0.12)',  id: 'bitcoin-cash' },
  LINK: { emoji: '⬡', name: 'Chainlink',   color: '#2a5ada', bg: 'rgba(42,90,218,0.12)',   id: 'chainlink' },
};

export default function Home() {
  const rates = useSelector((s: RootState) => s.exchangeRates);
  const navigate = useNavigate();
  const loading = Object.keys(rates).length === 0;

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>Live Crypto Dashboard</h1>
          <p className={styles.heroSub}>Click any coin to compare prices across 9 exchanges in real time.</p>
        </div>
        <Link to="/market" className={styles.marketLink}>View Full Market →</Link>
      </div>

      {/* Coin Cards */}
      <div className={styles.grid}>
        {loading
          ? [...Array(10)].map((_, i) => <div key={i} className={styles.skeleton} />)
          : Object.entries(rates).map(([ticker, exchanges]) => {
              const meta = COIN_META[ticker];
              if (!meta) return null;

              const valid = Object.entries(exchanges).filter(([, e]) => Number(e.price) > 0); 
              const prices = valid.map(([, e]) => Number(e.price));
              const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
              const hi = prices.length ? Math.max(...prices) : 0;
              const lo = prices.length ? Math.min(...prices) : 0;
              const spread = hi - lo;
              const spreadPct = avg > 0 ? (spread / avg) * 100 : 0;
              const hiEx = valid.length > 1 ? valid.reduce((b, c) => Number(c[1].price) > Number(b[1].price) ? c : b)[0] : null;
              const loEx = valid.length > 1 ? valid.reduce((b, c) => Number(c[1].price) < Number(b[1].price) ? c : b)[0] : null;

              return (
                <div
                  key={ticker}
                  className={styles.card}
                  onClick={() => navigate(`/coin/${meta.id}`)}
                  style={{ '--coin-color': meta.color } as React.CSSProperties}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.iconWrap} style={{ background: meta.bg }}>
                      <span className={styles.coinEmoji} style={{ color: meta.color }}>{meta.emoji}</span>
                    </div>
                    <div className={styles.coinInfo}>
                      <span className={styles.coinName}>{meta.name}</span>
                      <span className={styles.coinTicker} style={{ color: meta.color }}>{ticker}</span>
                    </div>
                    <span className={styles.arrow}>→</span>
                  </div>

                  <div className={styles.avgPrice}>
                    {avg > 0 ? `$${avg.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                  </div>
                  <div className={styles.avgLabel}>Average across exchanges</div>

                  {hiEx && loEx && (
                    <div className={styles.hiLoRow}>
                      <div className={styles.hiLoItem}>
                        <span className={styles.hiLoIcon} style={{ color: 'var(--green)' }}>↑</span>
                        <div>
                          <div className={styles.hiLoEx}>{hiEx.split(' ')[0]}</div>
                          <div className={styles.hiLoPrice} style={{ color: 'var(--green)' }}>
                            ${hi.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                      <div className={styles.hiLoSep} />
                      <div className={styles.hiLoItem}>
                        <span className={styles.hiLoIcon} style={{ color: 'var(--red)' }}>↓</span>
                        <div>
                          <div className={styles.hiLoEx}>{loEx.split(' ')[0]}</div>
                          <div className={styles.hiLoPrice} style={{ color: 'var(--red)' }}>
                            ${lo.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={styles.spreadRow}>
                    <span className={styles.spreadLabel}>Spread</span>
                    <span className={styles.spreadPct}>{spreadPct > 0 ? `${spreadPct.toFixed(3)}%` : '—'}</span>
                  </div>
                  <div className={styles.bar}>
                    <div className={styles.barFill} style={{ width: `${Math.min(spreadPct * 20, 100)}%`, background: meta.color }} />
                  </div>

                  <div className={styles.cardFoot}>
                   <span className={styles.exCount}>{Object.keys(exchanges).length} exchanges</span>
                    <span className={styles.viewTxt}>View Details →</span>
                  </div>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}