import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { WS_URL } from '../constants/config';

type CurrencyMap = Record<string, { price: string }>;
type RatesMap    = Record<string, CurrencyMap>;

interface WSCtx { rates: RatesMap; connected: boolean; }
const WSContext = createContext<WSCtx>({ rates: {}, connected: false });
export const useRates = () => useContext(WSContext);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [rates, setRates] = useState<RatesMap>({});
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen  = () => setConnected(true);
      ws.onclose = () => { setConnected(false); setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (!msg.data) return;
          const exchange   = msg.data.exchange_name;
          const currencies = msg.data.Currencies as { name: string; price: string }[] | null;
          
          if (!currencies || !Array.isArray(currencies)) return;
          
          setRates(prev => {
            const updated = { ...prev, [exchange]: { ...(prev[exchange] || {}) } };
            currencies.forEach(c => { updated[exchange][c.name] = { price: c.price }; });
            return updated;
          });
        } catch {}
      };
    };
    connect();
    return () => wsRef.current?.close();
  }, []);

  return <WSContext.Provider value={{ rates, connected }}>{children}</WSContext.Provider>;
}