import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { mergeRates, Rates } from '../store/exchangeRatesSlice';

const WS_URL = 'ws://localhost:8081/prices';

const COIN_META_KEYS = ['BTC','ETH','ADA','SOL','DOGE','XRP','DOT','LTC','BCH','LINK'];

interface BackendMessage {
  data: { exchange_name: string; Currencies: { name: string; price: string }[] };
  errorMessage: string;
}

export default function WebSocketProvider() {
  const dispatch = useDispatch();
  const wsRef = useRef<WebSocket | null>(null);
  const [wsError, setWsError] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => { setConnected(true); setWsError(false); };
      ws.onmessage = (event) => {
        try {
          const msg: BackendMessage = JSON.parse(event.data);
          if (msg.errorMessage || !msg.data?.exchange_name || !msg.data?.Currencies?.length) return;
          const incoming: Rates = {};
          msg.data.Currencies.forEach(({ name, price }) => {
            const key = name.toUpperCase();
            if (!COIN_META_KEYS.includes(key)) return;
            const num = parseFloat(price);
            if (!num || num <= 0) return;
            if (!incoming[key]) incoming[key] = {};
            incoming[key][msg.data.exchange_name] = { price: num.toFixed(2) };
          });
          if (Object.keys(incoming).length > 0) {
            dispatch(mergeRates(incoming));
            setLastUpdated(new Date().toLocaleTimeString());
          }
        } catch {}
      };
      ws.onerror = () => { setConnected(false); setWsError(true); };
      ws.onclose = () => { setConnected(false); reconnectTimer = setTimeout(connect, 3000); };
    };

    connect();
    return () => { clearTimeout(reconnectTimer); wsRef.current?.close(); };
  }, [dispatch]);

  if (wsError) {
    return (
      <div style={{
        background: 'rgba(246,70,93,0.07)',
        border: '1px solid rgba(246,70,93,0.2)',
        borderRadius: 8,
        padding: '10px 16px',
        fontSize: '0.78rem',
        color: 'var(--text-secondary)',
        marginBottom: 16
      }}>
        ⚠ Cannot reach backend at <code style={{ color: 'var(--red)', background: 'var(--bg-card)', padding: '1px 5px', borderRadius: 3 }}>{WS_URL}</code> — run <code style={{ color: 'var(--accent)', background: 'var(--bg-card)', padding: '1px 5px', borderRadius: 3 }}>docker-compose up</code>
      </div>
    );
  }

  if (connected) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'none' }} />
          Live · {lastUpdated}
        </span>
      </div>
    );
  }

  return null;
}