import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import styles from './Compare.module.css';

type CoinMeta = {
  emoji: string;
  name: string;
  color: string;
  id: string;
};

const COIN_META: Record<string, CoinMeta> = {
  BTC: { emoji: '₿', name: 'Bitcoin', color: '#f7931a', id: 'bitcoin' },
  ETH: { emoji: 'Ξ', name: 'Ethereum', color: '#627eea', id: 'ethereum' },
  ADA: { emoji: '₳', name: 'Cardano', color: '#3cc8c8', id: 'cardano' },
  SOL: { emoji: '◎', name: 'Solana', color: '#9945ff', id: 'solana' },
  DOGE: { emoji: 'Ð', name: 'Dogecoin', color: '#c2a633', id: 'dogecoin' },
  XRP: { emoji: '✕', name: 'XRP', color: '#00aae4', id: 'ripple' },
  DOT: { emoji: '●', name: 'Polkadot', color: '#e6007a', id: 'polkadot' },
  LTC: { emoji: 'Ł', name: 'Litecoin', color: '#bebebe', id: 'litecoin' },
  BCH: { emoji: '₿', name: 'Bitcoin Cash', color: '#8dc351', id: 'bitcoin-cash' },
  LINK: { emoji: '⬡', name: 'Chainlink', color: '#2a5ada', id: 'chainlink' },
};

const formatPrice = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type ComparisonResult = {
  a: number;
  b: number;
  buyExchange: string;
  sellExchange: string;
  spread: number;
  spreadPct: number;
  suggestion: string;
};

const getSuggestion = (lowPrice: number, highPrice: number, lowExchange: string, highExchange: string) => {
  const spread = highPrice - lowPrice;
  const spreadPct = lowPrice > 0 ? (spread / lowPrice) * 100 : 0;

  if (spreadPct >= 3) {
    return `There is a meaningful price gap here. If you are buying, ${lowExchange} is the better entry point. If you already hold the coin, ${highExchange} is the stronger place to consider selling.`;
  }

  if (spreadPct >= 1) {
    return `The gap is moderate. A buy on ${lowExchange} and a sell on ${highExchange} could make sense, but fees may reduce the advantage.`;
  }

  return `The prices are very close. This looks like a hold or spot-buy situation unless you are specifically trading on small spreads.`;
};

export default function Compare() {
  const rates = useSelector((state: RootState) => state.exchangeRates);
  const navigate = useNavigate();

  const availableCoins = useMemo(() => Object.keys(rates).filter(coin => COIN_META[coin]), [rates]);
  const [selectedCoin, setSelectedCoin] = useState('');
  const exchanges = useMemo(() => Object.keys(rates[selectedCoin] ?? {}), [rates, selectedCoin]);
  const [exchangeA, setExchangeA] = useState('');
  const [exchangeB, setExchangeB] = useState('');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState('');
  const [didAutoCompare, setDidAutoCompare] = useState(false);

  useEffect(() => {
    if (!availableCoins.length) {
      setSelectedCoin('');
      setExchangeA('');
      setExchangeB('');
      return;
    }

    if (!selectedCoin || !availableCoins.includes(selectedCoin)) {
      setSelectedCoin(availableCoins[0]);
    }
  }, [availableCoins, selectedCoin]);

  useEffect(() => {
    const nextExchanges = Object.keys(rates[selectedCoin] ?? {});
    if (!nextExchanges.length) {
      setExchangeA('');
      setExchangeB('');
      return;
    }

    if (!exchangeA || !nextExchanges.includes(exchangeA)) {
      setExchangeA(nextExchanges[0]);
    }

    if (!exchangeB || !nextExchanges.includes(exchangeB)) {
      setExchangeB(nextExchanges[1] ?? nextExchanges[0]);
    }
  }, [rates, selectedCoin, exchangeA, exchangeB]);

  const clearComparison = () => {
    setResult(null);
    setError('');
  };

  const handleCompare = () => {
    if (!selectedCoin || !exchangeA || !exchangeB) {
      setError('Please select coin, Exchange A, and Exchange B before comparing.');
      setResult(null);
      return;
    }

    // allow comparing the same exchange (will show zero spread)

    const coinRates = rates[selectedCoin] ?? {};
    const a = Number(coinRates[exchangeA]?.price);
    const b = Number(coinRates[exchangeB]?.price);

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      setError('Price data is not available for one or both selected exchanges.');
      setResult(null);
      return;
    }

    const lower = Math.min(a, b);
    const higher = Math.max(a, b);
    const buyExchange = a <= b ? exchangeA : exchangeB;
    const sellExchange = a > b ? exchangeA : exchangeB;
    const spread = higher - lower;
    const spreadPct = lower > 0 ? (spread / lower) * 100 : 0;

    setResult({
      a,
      b,
      buyExchange,
      sellExchange,
      spread,
      spreadPct,
      suggestion: getSuggestion(lower, higher, buyExchange, sellExchange),
    });
    setError('');
  };

  // Auto-run a comparison once when the page first loads/reloads and
  // the defaults are BTC with KuCoin present. This avoids forcing the
  // user to click the Compare button if defaults are already set.
  useEffect(() => {
    if (didAutoCompare) return;
    // run only when selections are populated
    if (!selectedCoin || !exchangeA || !exchangeB) return;

    // prefer auto-compare when coin is BTC (default) and KuCoin exists
    const wantCoin = 'BTC';
    const hasKuCoin = Object.keys(rates[selectedCoin] ?? {}).some(e => e.toLowerCase() === 'kucoin');
    const isDefaultBTC = selectedCoin === wantCoin;

    if (isDefaultBTC && hasKuCoin) {
      // if exchange keys are named like 'KuCoin' but case may vary,
      // ensure the selected exchanges are the KuCoin keys if possible
      const keys = Object.keys(rates[selectedCoin] ?? {});
      const kuKey = keys.find(k => k.toLowerCase() === 'kucoin');
      if (kuKey) {
        // set both to kuKey (user expects KuCoin vs KuCoin)
        if (exchangeA !== kuKey) setExchangeA(kuKey);
        if (exchangeB !== kuKey) setExchangeB(kuKey);
      }

      // perform the comparison (allow same-exchange comparison)
      handleCompare();
      setDidAutoCompare(true);
    }
  }, [didAutoCompare, selectedCoin, exchangeA, exchangeB, rates]);

  const meta = COIN_META[selectedCoin];

  const onCoinChange = (coin: string) => {
    clearComparison();
    setSelectedCoin(coin);
    const coinExchangeKeys = Object.keys(rates[coin] ?? {});
    setExchangeA(coinExchangeKeys[0] ?? '');
    setExchangeB(coinExchangeKeys[1] ?? coinExchangeKeys[0] ?? '');
  };

  return (
    <div className={styles.page}>
      <div className={styles.ambientOne} />
      <div className={styles.ambientTwo} />

      <div className={styles.hero}>
        <div>
          <div className={styles.kicker}>Exchange comparison</div>
          <h1 className={styles.title}>
            <span className={styles.titleMain}>Compare two exchanges</span>
            <span className={styles.titleAccent}>for the same coin.</span>
          </h1>
          <p className={styles.subtitle}>
            Pick a coin, choose two exchanges, and see which one is cheaper for buying or better for selling.
          </p>
        </div>
        <button className={styles.backBtn} onClick={() => navigate('/market')}>
          Back to Market
        </button>
      </div>

      <div className={styles.layout}>
        <section className={styles.controlCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Comparison setup</span>
            <span className={styles.cardHint}>Select coin and exchanges</span>
          </div>

          <div className={styles.selectGrid}>
            <label className={styles.field}>
              <span>Coin</span>
              <select value={selectedCoin} onChange={e => onCoinChange(e.target.value)}>
                {availableCoins.map(coin => {
                  const coinMeta = COIN_META[coin];
                  return (
                    <option key={coin} value={coin}>
                      {coinMeta.emoji} {coinMeta.name} ({coin})
                    </option>
                  );
                })}
              </select>
            </label>

            <label className={styles.field}>
              <span>Exchange A</span>
              <select
                value={exchangeA}
                onChange={e => {
                  clearComparison();
                  setExchangeA(e.target.value);
                }}
              >
                {exchanges.map(exchange => (
                  <option key={exchange} value={exchange}>{exchange}</option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Exchange B</span>
              <select
                value={exchangeB}
                onChange={e => {
                  clearComparison();
                  setExchangeB(e.target.value);
                }}
              >
                {exchanges.map(exchange => (
                  <option key={exchange} value={exchange}>{exchange}</option>
                ))}
              </select>
            </label>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <button type="button" className={styles.compareBtn} onClick={handleCompare}>
            Compare Exchanges
          </button>
        </section>

        <section className={styles.previewCard}>
          <div className={styles.previewGlow} />
          <div className={styles.previewTop}>
            <div className={styles.coinBadge} style={{ color: meta?.color }}>
              <span className={styles.coinEmoji}>{meta?.emoji ?? '◎'}</span>
              <div>
                <p>{meta?.name ?? selectedCoin}</p>
                <span>{selectedCoin}</span>
              </div>
            </div>

            <div className={styles.comparisonTag}>
              {result ? `${result.spreadPct.toFixed(2)}% spread` : 'Press Compare'}
            </div>
          </div>

          {!result ? (
            <div className={styles.emptyState}>
              <p>Select your fields and click Compare Exchanges to see the result.</p>
            </div>
          ) : (
            <>
              <div className={styles.compareGrid}>
                <article
                  className={`${styles.exchangePanel} ${result.a <= result.b ? styles.exchangeBest : ''}`}
                >
                  <span className={styles.exchangeLabel}>{exchangeA}</span>
                  <strong className={styles.exchangePrice}>${formatPrice(result.a)}</strong>
                  <span className={styles.exchangeNote}>{result.a <= result.b ? 'Better for buying' : 'Higher price point'}</span>
                </article>

                <article
                  className={`${styles.exchangePanel} ${result.b <= result.a ? styles.exchangeBest : ''}`}
                >
                  <span className={styles.exchangeLabel}>{exchangeB}</span>
                  <strong className={styles.exchangePrice}>${formatPrice(result.b)}</strong>
                  <span className={styles.exchangeNote}>{result.b <= result.a ? 'Better for buying' : 'Higher price point'}</span>
                </article>
              </div>

              <div className={styles.resultCard}>
                <div className={styles.resultRow}>
                  <span>Buy from</span>
                  <strong>{result.buyExchange}</strong>
                </div>
                <div className={styles.resultRow}>
                  <span>Sell on</span>
                  <strong>{result.sellExchange}</strong>
                </div>
                <div className={styles.resultRow}>
                  <span>Spread</span>
                  <strong>${formatPrice(result.spread)}</strong>
                </div>
                <div className={styles.resultRow}>
                  <span>Difference</span>
                  <strong>{result.spreadPct.toFixed(2)}%</strong>
                </div>
              </div>

              <div className={styles.suggestionCard}>
                <span className={styles.suggestionLabel}>Suggestion</span>
                <p>{result.suggestion}</p>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}