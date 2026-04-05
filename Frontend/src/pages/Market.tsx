import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import styles from './Market.module.css';

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

const downloadCSV = (rates: RootState['exchangeRates']) => {
  const rows = [['Coin', 'Avg Price (USD)', 'Highest Exchange', 'Lowest Exchange', 'Spread']];
  Object.entries(rates).forEach(([coin, exchanges]) => {
    const prices = Object.values(exchanges).map(e => Number(e.price)).filter(p => p > 0);
    if (!prices.length) return;
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const hi = Math.max(...prices);
    const lo = Math.min(...prices);
    const hiEx = Object.entries(exchanges).find(([, e]) => Number(e.price) === hi)?.[0] ?? '';
    const loEx = Object.entries(exchanges).find(([, e]) => Number(e.price) === lo)?.[0] ?? '';
    rows.push([coin, avg.toFixed(2), hiEx, loEx, (hi - lo).toFixed(2)]);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `exchangego_prices_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
};

export default function Market() {
  const rates = useSelector((s: RootState) => s.exchangeRates);
  const navigate = useNavigate();
  const loading = Object.keys(rates).length === 0;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Market Prices</h1>
          <p className={styles.pageSub}>Live average prices across 9 major exchanges</p>
        </div>
        <button className={styles.csvBtn} onClick={() => downloadCSV(rates)}>
          ↓ Export CSV
        </button>
      </div>

      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.loading}>Loading market data…</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr className={styles.headRow}>
                <th className={styles.th}>#</th>
                <th className={styles.th}>Coin</th>
                <th className={styles.th}>Avg Price</th>
                <th className={styles.th}>Highest Exchange</th>
                <th className={styles.th}>Lowest Exchange</th>
                <th className={styles.th}>Spread</th>
                <th className={styles.th}>Exchanges</th>
                <th className={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(rates).map(([ticker, exchanges], i) => {
                const meta = COIN_META[ticker];
                if (!meta) return null;
                const allP = Object.values(exchanges).map(e => Number(e.price));
                const maxR = Math.max(...allP);
                const valid = Object.entries(exchanges).filter(([, e]) => Number(e.price) >= maxR * 0.1);
                const prices = valid.map(([, e]) => Number(e.price));
                const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
                const hi = prices.length ? Math.max(...prices) : 0;
                const lo = prices.length ? Math.min(...prices) : 0;
                const hiEx = valid.length > 1 ? valid.reduce((b, c) => Number(c[1].price) > Number(b[1].price) ? c : b)[0] : '—';
                const loEx = valid.length > 1 ? valid.reduce((b, c) => Number(c[1].price) < Number(b[1].price) ? c : b)[0] : '—';
                const spread = hi - lo;
                return (
                  <tr key={ticker} className={styles.row} onClick={() => navigate(`/coin/${meta.id}`)}>
                    <td className={styles.td} style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{i + 1}</td>
                    <td className={styles.td}>
                      <div className={styles.coinCell}>
                        <div className={styles.coinIcon} style={{ background: meta.bg, border: `1.5px solid ${meta.color}40` }}>
                          <span style={{ color: meta.color }}>{meta.emoji}</span>
                        </div>
                        <div>
                          <div className={styles.coinName}>{meta.name}</div>
                          <div className={styles.coinTicker} style={{ color: meta.color }}>{ticker}</div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.avgPrice}>{avg > 0 ? `$${avg.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}</span>
                    </td>
                    <td className={styles.td}>
                      {hiEx !== '—' ? (
                        <><span className={styles.hiPrice}>${hi.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        <span className={styles.exName}>{hiEx.split(' ')[0]}</span></>
                      ) : '—'}
                    </td>
                    <td className={styles.td}>
                      {loEx !== '—' ? (
                        <><span className={styles.loPrice}>${lo.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        <span className={styles.exName}>{loEx.split(' ')[0]}</span></>
                      ) : '—'}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.spreadVal}>{spread > 0 ? `$${spread.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}</span>
                    </td>
                    <td className={styles.td} style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{valid.length}</td>
                    <td className={styles.td}>
                      <span className={styles.detailBtn}>Details →</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}