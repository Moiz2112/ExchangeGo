import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRates } from '../context/WebSocketContext';
import { COIN_META } from '../constants/coins';

interface CoinRow {
  ticker: string;
  average: number;
  high: number;
  highEx: string;
  low: number;
  lowEx: string;
  spread: number;
  spreadPct: number;
  exchangeCount: number;
}

export default function MarketScreen() {
  const { rates } = useRates();
  const navigation = useNavigation<any>();

  // Transform rates and calculate stats for each coin
  const coinRows: CoinRow[] = useMemo(() => {
    const tickerMap: Record<string, Record<string, number>> = {};
    
    Object.entries(rates).forEach(([exchange, coins]) => {
      Object.entries(coins).forEach(([ticker, data]) => {
        if (!COIN_META[ticker]) return;
        if (!tickerMap[ticker]) tickerMap[ticker] = {};
        tickerMap[ticker][exchange] = Number(data.price);
      });
    });

    return Object.entries(tickerMap)
      .map(([ticker, exchanges]) => {
        const prices = Object.values(exchanges).filter(p => p > 0);
        
        if (prices.length === 0) return null;

        const average = prices.reduce((a, b) => a + b, 0) / prices.length;
        const high = Math.max(...prices);
        const low = Math.min(...prices);
        const spread = high - low;
        const spreadPct = (spread / average) * 100;
        
        const highEx = Object.entries(exchanges).find(([, p]) => p === high)?.[0] || '';
        const lowEx = Object.entries(exchanges).find(([, p]) => p === low)?.[0] || '';

        return {
          ticker,
          average,
          high,
          low,
          highEx,
          lowEx,
          spread,
          spreadPct,
          exchangeCount: Object.keys(exchanges).length,
        };
      })
      .filter((x): x is CoinRow => x !== null)
      .sort((a, b) => b.average - a.average);
  }, [rates]);

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Full Market</Text>
      </View>

      {/* Column Headers */}
      <View style={s.columnsHeader}>
        <Text style={[s.col, { flex: 0.8 }]}>#</Text>
        <Text style={[s.col, { flex: 1.2 }]}>COIN</Text>
        <Text style={[s.col, { flex: 1.5 }]}>AVG PRICE</Text>
        <Text style={[s.col, { flex: 1.8 }]}>HIGH</Text>
        <Text style={[s.col, { flex: 1.8 }]}>LOW</Text>
        <Text style={[s.col, { flex: 1 }]}>SPREAD</Text>
      </View>

      {/* Coin Rows */}
      <FlatList
        data={coinRows}
        keyExtractor={(row, idx) => `${row.ticker}-${idx}`}
        contentContainerStyle={s.list}
        renderItem={({ item, index }) => {
          const meta = COIN_META[item.ticker];
          return (
            <TouchableOpacity
              style={[s.row, index === coinRows.length - 1 && s.rowLast]}
              onPress={() => navigation.navigate('CoinDetail', { ticker: item.ticker })}
              activeOpacity={0.7}
            >
              <Text style={[s.col, { flex: 0.8, color: '#f7931a', fontWeight: '700' }]}>
                {index + 1}
              </Text>
              
              <View style={[s.col, { flex: 1.2, flexDirection: 'row', alignItems: 'center' }]}>
                <View style={[s.dot, { backgroundColor: meta.bg }]}>
                  <Text style={{ fontSize: 16, color: meta.color }}>{meta.emoji}</Text>
                </View>
                <View style={{ marginLeft: 8 }}>
                  <Text style={s.cellTicker}>{item.ticker}</Text>
                </View>
              </View>

              <Text style={[s.col, { flex: 1.5, color: '#fff', fontWeight: '600' }]}>
                ${item.average.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>

              <View style={[s.col, { flex: 1.8, alignItems: 'flex-start' }]}>
                <Text style={s.cellValue}>
                  ${item.high.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={s.cellExchange}>{item.highEx}</Text>
              </View>

              <View style={[s.col, { flex: 1.8, alignItems: 'flex-start' }]}>
                <Text style={s.cellValue}>
                  ${item.low.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={s.cellExchange}>{item.lowEx}</Text>
              </View>

              <View style={[s.col, { flex: 1, alignItems: 'center' }]}>
                <Text style={[s.cellValue, { color: '#f7931a' }]}>
                  ${item.spread.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={[s.cellExchange, { color: '#f7931a' }]}>
                  {item.spreadPct.toFixed(2)}%
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#05060f' },
  header:   { flexDirection: 'row', alignItems: 'center', gap: 16,
              paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
              borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  back:     { color: '#888', fontSize: 20, fontWeight: '600' },
  title:    { color: '#fff', fontSize: 20, fontWeight: '800' },

  columnsHeader: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12,
                   borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
                   backgroundColor: 'rgba(0,0,0,0.3)' },
  col:     { fontSize: 10, fontWeight: '600', color: '#666', paddingHorizontal: 6 },

  list:    { paddingHorizontal: 8, paddingVertical: 4, paddingBottom: 32 },
  row:     { flexDirection: 'row', alignItems: 'center',
             paddingHorizontal: 8, paddingVertical: 12,
             borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
             backgroundColor: 'rgba(255,255,255,0.02)' },
  rowLast: { borderBottomWidth: 0 },

  dot:     { width: 32, height: 32, borderRadius: 8, justifyContent: 'center',
             alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  cellTicker: { color: '#fff', fontWeight: '700', fontSize: 12 },
  cellValue:  { color: '#fff', fontSize: 11, fontWeight: '600' },
  cellExchange: { color: '#666', fontSize: 9, marginTop: 2 },
});