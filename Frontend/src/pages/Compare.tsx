import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import styles from './Compare.module.css';

interface CoinOption {
  id: string;
  ticker: string;
  name: string;
  emoji: string;
  color: string;
}

interface CompareRow {
  id: number;
  coin: string;
}

type CompareStatus = 'incomplete' | 'missing' | 'matched' | 'spread';

interface CompareResult {
  rowId: number;
  coin: string;
  meta?: CoinOption;
  firstPrice: number | null;
  secondPrice: number | null;
  difference: number | null;
  spreadPct: number | null;
  status: CompareStatus;
  summary: string;
  suggestion: string;
  cheaperExchange: string | null;
}

const STATUS_LABELS: Record<CompareStatus, string> = {
  spread: 'Cheaper exchange found',
  matched: 'Prices aligned',
  missing: 'Missing feed',
  incomplete: 'Awaiting input',
};

const STATUS_CLASSES: Record<CompareStatus, string> = {
  spread: 'statusSpread',
  matched: 'statusMatched',
  missing: 'statusMissing',
  incomplete: 'statusIncomplete',
};

const COIN_OPTIONS: CoinOption[] = [
  { id: 'bitcoin', ticker: 'BTC', name: 'Bitcoin', emoji: '₿', color: '#f7931a' },
  { id: 'ethereum', ticker: 'ETH', name: 'Ethereum', emoji: 'Ξ', color: '#627eea' },
  { id: 'cardano', ticker: 'ADA', name: 'Cardano', emoji: '₳', color: '#3cc8c8' },
  { id: 'solana', ticker: 'SOL', name: 'Solana', emoji: '◎', color: '#9945ff' },
  { id: 'dogecoin', ticker: 'DOGE', name: 'Dogecoin', emoji: 'Ð', color: '#c2a633' },
  { id: 'ripple', ticker: 'XRP', name: 'XRP', emoji: '✕', color: '#00aae4' },
  { id: 'polkadot', ticker: 'DOT', name: 'Polkadot', emoji: '●', color: '#e6007a' },
  { id: 'litecoin', ticker: 'LTC', name: 'Litecoin', emoji: 'Ł', color: '#bebebe' },
  { id: 'bitcoin-cash', ticker: 'BCH', name: 'Bitcoin Cash', emoji: '₿', color: '#8dc351' },
  { id: 'chainlink', ticker: 'LINK', name: 'Chainlink', emoji: '⬡', color: '#2a5ada' },
];

const COIN_BY_TICKER = Object.fromEntries(COIN_OPTIONS.map((coin) => [coin.ticker, coin])) as Record<string, CoinOption>;

const INITIAL_ROWS: CompareRow[] = [{ id: 1, coin: 'BTC' }];

const parsePrice = (price?: string) => {
  const parsed = Number(price);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const formatCurrency = (value: number | null) =>
  value === null
    ? '—'
    : `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Compare() {
  const rates = useSelector((state: RootState) => state.exchangeRates);
  const [exchangeOne, setExchangeOne] = useState('');
  const [exchangeTwo, setExchangeTwo] = useState('');
  const [rows, setRows] = useState<CompareRow[]>(INITIAL_ROWS);

  const exchanges = useMemo(
    () =>
      Array.from(new Set(Object.values(rates).flatMap((coinRates) => Object.keys(coinRates)))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [rates]
  );

  const results = useMemo<CompareResult[]>(
    () =>
      rows.map((row) => {
        const meta = COIN_BY_TICKER[row.coin];
        const coinRates = rates[row.coin] ?? {};

        if (!row.coin || !exchangeOne || !exchangeTwo || exchangeOne === exchangeTwo) {
          return {
            rowId: row.id,
            coin: row.coin,
            meta,
            firstPrice: null,
            secondPrice: null,
            difference: null,
            spreadPct: null,
            status: 'incomplete',
            summary: 'Select a coin and two different exchanges to compare prices.',
            suggestion: 'Choose both exchange inputs to unlock the comparison result.',
            cheaperExchange: null,
          };
        }

        const firstPrice = parsePrice(coinRates[exchangeOne]?.price);
        const secondPrice = parsePrice(coinRates[exchangeTwo]?.price);

        if (firstPrice === null || secondPrice === null) {
          return {
            rowId: row.id,
            coin: row.coin,
            meta,
            firstPrice,
            secondPrice,
            difference: null,
            spreadPct: null,
            status: 'missing',
            summary: `${meta?.name ?? row.coin} does not currently have live pricing on one of the selected exchanges.`,
            suggestion: 'Try another exchange pair or wait for the live feed to update.',
            cheaperExchange: null,
          };
        }

        const difference = Math.abs(firstPrice - secondPrice);
        const lowerPrice = Math.min(firstPrice, secondPrice);
        const spreadPct = lowerPrice > 0 ? (difference / lowerPrice) * 100 : 0;

        if (difference < 0.01 || spreadPct < 0.05) {
          return {
            rowId: row.id,
            coin: row.coin,
            meta,
            firstPrice,
            secondPrice,
            difference,
            spreadPct,
            status: 'matched',
            summary: `${exchangeOne} and ${exchangeTwo} are pricing ${meta?.name ?? row.coin} almost the same right now.`,
            suggestion: 'No strong edge yet. Watch this pair for a wider gap before acting.',
            cheaperExchange: null,
          };
        }

        const cheaperExchange = firstPrice < secondPrice ? exchangeOne : exchangeTwo;
        const higherExchange = firstPrice < secondPrice ? exchangeTwo : exchangeOne;

        return {
          rowId: row.id,
          coin: row.coin,
          meta,
          firstPrice,
          secondPrice,
          difference,
          spreadPct,
          status: 'spread',
          summary: `${cheaperExchange} is currently offering the lower price for ${meta?.name ?? row.coin}.`,
          suggestion: `${meta?.ticker ?? row.coin} is ${formatCurrency(difference)} cheaper on ${cheaperExchange}; ${higherExchange} is pricing it ${spreadPct.toFixed(2)}% higher.`,
          cheaperExchange,
        };
      }),
    [exchangeOne, exchangeTwo, rates, rows]
  );

  const selectedResults = results.filter((result) => result.coin);
  const canAddRow = rows.length < COIN_OPTIONS.length;

  const addRow = () => {
    setRows((currentRows) => {
      const nextRowId = currentRows.length > 0 ? Math.max(...currentRows.map((row) => row.id)) + 1 : 1;
      return [...currentRows, { id: nextRowId, coin: '' }];
    });
  };

  const updateRow = (rowId: number, coin: string) => {
    setRows((currentRows) => currentRows.map((row) => (row.id === rowId ? { ...row, coin } : row)));
  };

  const removeRow = (rowId: number) => {
    setRows((currentRows) => {
      if (currentRows.length <= 1) {
        return currentRows;
      }

      return currentRows.filter((row) => row.id !== rowId);
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Exchange Comparison</h1>
          <p className={styles.pageSub}>Pick coins and compare live prices across any two exchanges in one place.</p>
        </div>
        <div className={styles.liveBadge}>
          <span className={styles.liveDot} />
          {exchanges.length > 0 ? `${exchanges.length} exchanges live` : 'Waiting for live exchange data'}
        </div>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Comparison Setup</h2>
            <p className={styles.sectionSub}>Select two exchanges, then add the coins you want to compare below.</p>
          </div>
        </div>

        <div className={styles.exchangeGrid}>
          <label className={styles.field}>
            <span className={styles.label}>Exchange 1</span>
            <select
              className={styles.select}
              value={exchangeOne}
              onChange={(event) => setExchangeOne(event.target.value)}
            >
              <option value="">Select exchange</option>
              {exchanges.map((exchange) => (
                <option key={exchange} value={exchange}>
                  {exchange}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.versus}>VS</div>

          <label className={styles.field}>
            <span className={styles.label}>Exchange 2</span>
            <select
              className={styles.select}
              value={exchangeTwo}
              onChange={(event) => setExchangeTwo(event.target.value)}
            >
              <option value="">Select exchange</option>
              {exchanges.map((exchange) => (
                <option key={exchange} value={exchange}>
                  {exchange}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.coinRows}>
          {rows.map((row, index) => (
            <div key={row.id} className={styles.coinRow}>
              <label className={styles.field}>
                <span className={styles.label}>Coin {index + 1}</span>
                <select
                  className={styles.select}
                  value={row.coin}
                  onChange={(event) => updateRow(row.id, event.target.value)}
                >
                  <option value="">Select coin</option>
                  {COIN_OPTIONS.map((coin) => (
                    <option key={coin.ticker} value={coin.ticker}>
                      {coin.name} ({coin.ticker})
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeRow(row.id)}
                disabled={rows.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button type="button" className={styles.addBtn} onClick={addRow} disabled={!canAddRow}>
          + Add another coin
        </button>
      </section>

      <section className={styles.resultsSection}>
        <div className={styles.resultsHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Results & Suggestions</h2>
            <p className={styles.sectionSub}>Your comparison result appears here as soon as the selections are ready.</p>
          </div>
        </div>

        {selectedResults.length === 0 ? (
          <div className={styles.emptyState}>Add at least one coin to see a live comparison result.</div>
        ) : (
          <div className={styles.resultsGrid}>
            {selectedResults.map((result) => (
              <article key={result.rowId} className={styles.resultCard}>
                <div className={styles.resultTop}>
                  <div className={styles.coinBadge} style={{ color: result.meta?.color ?? 'var(--accent)' }}>
                    <span className={styles.coinEmoji}>{result.meta?.emoji ?? '●'}</span>
                    <div>
                      <div className={styles.coinName}>{result.meta?.name ?? result.coin}</div>
                      <div className={styles.coinTicker}>{result.meta?.ticker ?? result.coin}</div>
                    </div>
                  </div>
                  <span className={`${styles.statusTag} ${styles[STATUS_CLASSES[result.status]]}`}>
                    {result.status === 'spread' ? `Cheaper on ${result.cheaperExchange}` : STATUS_LABELS[result.status]}
                  </span>
                </div>

                <div className={styles.metrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>{exchangeOne || 'Exchange 1'}</span>
                    <span className={styles.metricValue}>{formatCurrency(result.firstPrice)}</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>{exchangeTwo || 'Exchange 2'}</span>
                    <span className={styles.metricValue}>{formatCurrency(result.secondPrice)}</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Difference</span>
                    <span className={styles.metricValue}>{formatCurrency(result.difference)}</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Spread</span>
                    <span className={styles.metricValue}>
                      {result.spreadPct === null ? '—' : `${result.spreadPct.toFixed(2)}%`}
                    </span>
                  </div>
                </div>

                <div className={styles.messageBlock}>
                  <span className={styles.messageLabel}>Result</span>
                  <p className={styles.messageText}>{result.summary}</p>
                </div>

                <div className={styles.messageBlock}>
                  <span className={styles.messageLabel}>Suggestion</span>
                  <p className={styles.messageText}>{result.suggestion}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
