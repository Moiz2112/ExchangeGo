import { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:8081';
const POLL_INTERVAL = 10_000; // re-check every 10 s

export interface CoinMeta {
  ticker: string;
  name: string;
  emoji: string;
  color: string;
  display_order: number;
  enabled: boolean;
}

export interface FeaturedCoin {
  id: number;
  ticker: string;
  category: string;
}

export interface SiteConfig {
  enabled_coins: string[];        // e.g. ["BTC","ETH",...]
  enabled_exchanges: string[];    // e.g. ["binance","kraken",...]
  coins_meta: CoinMeta[];         // full metadata ordered by display_order
  featured: FeaturedCoin[];       // featured selections
}

const DEFAULT_CONFIG: SiteConfig = {
  enabled_coins: ['BTC','ETH','ADA','SOL','DOGE','XRP','DOT','LTC','BCH','LINK'],
  enabled_exchanges: ['binance','kraken','coinbase','okx','kucoin','gateio','bitstamp','huobi','bitfinex'],
  coins_meta: [],
  featured: [],
};

let _cache: SiteConfig = DEFAULT_CONFIG;
let _listeners: Array<(c: SiteConfig) => void> = [];

async function fetchConfig() {
  try {
    const res = await fetch(`${API}/config`);
    if (!res.ok) return;
    const data: SiteConfig = await res.json();
    if (!data.enabled_coins || data.enabled_coins.length === 0) return; // guard
    _cache = data;
    _listeners.forEach(fn => fn(data));
  } catch { /* backend not running — keep defaults */ }
}

// Single global polling loop
let _started = false;
function startPolling() {
  if (_started) return;
  _started = true;
  fetchConfig();
  setInterval(fetchConfig, POLL_INTERVAL);
}

export function useConfig(): SiteConfig {
  const [config, setConfig] = useState<SiteConfig>(_cache);

  const listener = useCallback((c: SiteConfig) => setConfig(c), []);

  useEffect(() => {
    _listeners.push(listener);
    startPolling();
    return () => { _listeners = _listeners.filter(l => l !== listener); };
  }, [listener]);

  return config;
}