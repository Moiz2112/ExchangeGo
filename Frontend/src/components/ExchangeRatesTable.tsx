import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styles from './ExchangeRatesTable.module.css';
import { mergeRates, Rates } from '../store/exchangeRatesSlice';
import { RootState } from '../store';

// ── Backend WebSocket URL ──────────────────────────────────────────────────
// When your Go backend is running locally:  ws://localhost:8081/prices
// When deployed, replace with your server:  ws://your-server.com/prices
const WS_URL = 'ws://localhost:8081/prices';

// ── Coin display config ────────────────────────────────────────────────────
// Backend sends: BTC, ETH, ADA, DOGE, DOT, LTC, BCH, XRP, SOL, LINK
const COIN_META: Record<string, { emoji: string; fullName: string; color: string; bg: string; id: string }> = {
  BTC:  { emoji: '₿', fullName: 'Bitcoin',    color: '#f7931a', bg: 'rgba(247,147,26,0.12)',  id: 'bitcoin' },
  ETH:  { emoji: 'Ξ', fullName: 'Ethereum',   color: '#627eea', bg: 'rgba(98,126,234,0.12)',  id: 'ethereum' },
  ADA:  { emoji: '₳', fullName: 'Cardano',    color: '#3cc8c8', bg: 'rgba(60,200,200,0.12)',  id: 'cardano' },
  SOL:  { emoji: '◎', fullName: 'Solana',     color: '#9945ff', bg: 'rgba(153,69,255,0.12)',  id: 'solana' },
  DOGE: { emoji: 'Ð', fullName: 'Dogecoin',   color: '#c2a633', bg: 'rgba(194,166,51,0.12)',  id: 'dogecoin' },
  XRP:  { emoji: '✕', fullName: 'XRP',        color: '#00aae4', bg: 'rgba(0,170,228,0.12)',   id: 'ripple' },
  DOT:  { emoji: '●', fullName: 'Polkadot',   color: '#e6007a', bg: 'rgba(230,0,122,0.12)',   id: 'polkadot' },
  LTC:  { emoji: 'Ł', fullName: 'Litecoin',   color: '#bebebe', bg: 'rgba(190,190,190,0.12)', id: 'litecoin' },
  BCH:  { emoji: '₿', fullName: 'Bitcoin Cash', color: '#8dc351', bg: 'rgba(141,195,81,0.12)', id: 'bitcoin-cash' },
  LINK: { emoji: '⬡', fullName: 'Chainlink',  color: '#2a5ada', bg: 'rgba(42,90,218,0.12)',   id: 'chainlink' },
};

// Backend message shape
interface BackendMessage {
  data: {
    exchange_name: string;
    Currencies: { name: string; price: string }[];
  };
  errorMessage: string;
}

const ExchangeRatesTable = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const rates = useSelector((state: RootState) => state.exchangeRates);
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [wsError, setWsError] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setWsError(false);
      };

      ws.onmessage = (event) => {
        try {
          const msg: BackendMessage = JSON.parse(event.data);

          if (msg.errorMessage || !msg.data?.exchange_name || !msg.data?.Currencies?.length) return;

          const exchangeName = msg.data.exchange_name;
          const incoming: Rates = {};

          msg.data.Currencies.forEach(({ name, price }) => {
            const coinKey = name.toUpperCase();
            if (!COIN_META[coinKey]) return; // skip unknown coins
            const numPrice = parseFloat(price);
            if (!numPrice || numPrice <= 0) return; // skip invalid prices

            if (!incoming[coinKey]) incoming[coinKey] = {};
            incoming[coinKey][exchangeName] = { price: numPrice.toFixed(2) };
          });

          if (Object.keys(incoming).length > 0) {
            dispatch(mergeRates(incoming));
            setLastUpdated(new Date().toLocaleTimeString());
          }
        } catch (e) {
          console.error('WebSocket parse error:', e);
        }
      };

      ws.onerror = () => {
        setConnected(false);
        setWsError(true);
      };

      ws.onclose = () => {
        setConnected(false);
        // Auto-reconnect after 3 seconds
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [dispatch]);

  const allExchanges = Array.from(
    new Set(Object.values(rates).flatMap(c => Object.keys(c)))
  ).sort();

  const loading = Object.keys(rates).length === 0;

  return (
    <div>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <span className={styles.topTitle}>Market Overview</span>
          {!loading && <span className={styles.topCount}>{Object.keys(rates).length} assets</span>}
        </div>
        <div className={styles.topBarRight}>
          {/* Connection status */}
          <span className={`${styles.connBadge} ${connected ? styles.connOnline : wsError ? styles.connError : styles.connConnecting}`}>
            <span className={styles.connDot} />
            {connected ? `Live · ${lastUpdated}` : wsError ? 'Backend offline' : 'Connecting…'}
          </span>
        </div>
      </div>

      {/* Backend offline notice */}
      {wsError && (
        <div className={styles.offlineNotice}>
          ⚠ Cannot reach backend at <code>{WS_URL}</code> — make sure your Go server is running with <code>docker-compose up</code>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrapper}>
        <div className={styles.scrollWrapper}>
          <table className={styles.table}>
            <colgroup>
              <col className={styles.colRank} />
              <col className={styles.colAsset} />
              <col className={styles.colAvg} />
              {allExchanges.map((_, i) => (
                <col key={i} className={styles.colExchange} />
              ))}
            </colgroup>

            <thead>
              <tr className={styles.headRow}>
                <th className={styles.th}>#</th>
                <th className={styles.th}>Asset</th>
                <th className={styles.th}>Avg Price</th>
                {allExchanges.map(ex => (
                  <th key={ex} className={styles.th}>{ex}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} className={styles.row}>
                      {[44, 160, 110, ...(allExchanges.length ? allExchanges.map(() => 90) : [90, 90, 90, 90])].map((w, j) => (
                        <td key={j} className={styles.td}>
                          <div className={styles.skel} style={{ width: w }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : Object.entries(rates).map(([coinKey, exchanges], index) => {
                    const meta = COIN_META[coinKey];
                    if (!meta) return null;

                    const allPrices = Object.values(exchanges).map(e => Number(e.price));
                    const maxRaw = Math.max(...allPrices);
                    const validEntries = Object.entries(exchanges).filter(([, e]) => Number(e.price) >= maxRaw * 0.1);
                    const validPrices = validEntries.map(([, e]) => Number(e.price));

                    const avg = validPrices.length
                      ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length : 0;
                    const hi = validPrices.length ? Math.max(...validPrices) : 0;
                    const lo = validPrices.length ? Math.min(...validPrices) : 0;
                    const spread = hi - lo;
                    const pricesDiffer = validPrices.length > 1 && spread > 0.01;

                    const highExchange = pricesDiffer
                      ? validEntries.reduce((b, c) => Number(c[1].price) > Number(b[1].price) ? c : b)[0]
                      : null;
                    const lowExchange = pricesDiffer
                      ? validEntries.reduce((b, c) => Number(c[1].price) < Number(b[1].price) ? c : b)[0]
                      : null;

                    return (
                      <tr
                        key={coinKey}
                        className={styles.row}
                        onClick={() => navigate(`/coin/${meta.id}`)}
                      >
                        <td className={styles.tdRank}>{index + 1}</td>

                        <td className={styles.td}>
                          <div className={styles.coinCell}>
                            <div className={styles.coinIcon} style={{ background: meta.bg, border: `1.5px solid ${meta.color}50` }}>
                              <span style={{ color: meta.color }}>{meta.emoji}</span>
                            </div>
                            <div className={styles.coinInfo}>
                              <span className={styles.coinName}>{meta.fullName}</span>
                              <span className={styles.coinSymbol} style={{ color: meta.color }}>{coinKey}</span>
                            </div>
                          </div>
                        </td>

                        <td className={styles.tdAvgPrice}>
                          <span className={styles.avgPrice}>
                            {avg > 0 ? `$${avg.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                          </span>
                        </td>

                        {allExchanges.map(exchange => {
                          const entry = exchanges[exchange];
                          const price = entry ? Number(entry.price) : null;
                          const isValid = price !== null && price >= maxRaw * 0.1;
                          const isHigh = isValid && exchange === highExchange;
                          const isLow  = isValid && exchange === lowExchange;

                          return (
                            <td key={exchange} className={styles.td}>
                              {isValid ? (
                                <div className={styles.priceCell}>
                                  <span className={`${styles.price} ${isHigh ? styles.priceGreen : isLow ? styles.priceRed : ''}`}>
                                    ${price!.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </span>
                                  {isHigh && <span className={styles.arrowUp}>↑</span>}
                                  {isLow  && <span className={styles.arrowDown}>↓</span>}
                                </div>
                              ) : (
                                <span className={styles.dash}>—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        <div className={styles.footer}>
          <span>All prices in USD · Click any row to view coin details</span>
          <span>Green = highest · Red = lowest price across exchanges</span>
        </div>
      </div>
    </div>
  );
};

export default ExchangeRatesTable;