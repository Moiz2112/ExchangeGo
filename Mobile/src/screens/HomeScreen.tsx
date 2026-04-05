import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRates } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { COIN_META } from '../constants/coins';

interface CoinStats {
  ticker: string;
  average: number;
  high: number;
  low: number;
  spread: number;
  spreadPct: number;
  highEx: string;
  lowEx: string;
}

export default function HomeScreen() {
  const { rates, connected } = useRates();
  const { user, logout }     = useAuth();
  const navigation            = useNavigation<any>();

  // Transform rates data and calculate stats
  const coinStats: CoinStats[] = useMemo(() => {
    // rates structure: { "Binance": { "BTC": { price: "..." }, ... }, ... }
    // Transform to: { "BTC": { "Binance": {...}, ... }, ... }
    const tickerMap: Record<string, Record<string, number>> = {};
    
    Object.entries(rates).forEach(([exchange, coins]) => {
      Object.entries(coins).forEach(([ticker, data]) => {
        if (!COIN_META[ticker]) return;
        if (!tickerMap[ticker]) tickerMap[ticker] = {};
        tickerMap[ticker][exchange] = Number(data.price);
      });
    });

    // Calculate stats for each ticker
    return Object.entries(tickerMap).map(([ticker, exchanges]) => {
      const prices = Object.values(exchanges).filter(p => p > 0);
      
      if (prices.length === 0) {
        return {
          ticker,
          average: 0,
          high: 0,
          low: 0,
          spread: 0,
          spreadPct: 0,
          highEx: '',
          lowEx: '',
        };
      }

      const average = prices.reduce((a, b) => a + b, 0) / prices.length;
      const high = Math.max(...prices);
      const low = Math.min(...prices);
      const spread = high - low;
      const spreadPct = (spread / average) * 100;
      
      const highEx = Object.entries(exchanges).find(([, p]) => p === high)?.[0] || '';
      const lowEx = Object.entries(exchanges).find(([, p]) => p === low)?.[0] || '';

      return { ticker, average, high, low, spread, spreadPct, highEx, lowEx };
    });
  }, [rates]);

  const loading = coinStats.length === 0;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.logo}>ExchangeGO</Text>
          <View style={s.statusRow}>
            <View style={[s.dot, { backgroundColor: connected ? '#00ff88' : '#ff2d9b' }]} />
            <Text style={s.statusTxt}>{connected ? 'Live' : 'Connecting…'}</Text>
          </View>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={logout}>
          <Text style={s.logoutTxt}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={s.hero}>
        <View>
          <Text style={s.heroTitle}>Live Dashboard</Text>
          <Text style={s.heroSub}>Tap any coin to compare exchanges</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Market')}>
          <Text style={s.marketLink}>Full Market →</Text>
        </TouchableOpacity>
      </View>

      {/* Coin Cards */}
      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#f7931a" />
          <Text style={s.loadingTxt}>Waiting for price data…</Text>
        </View>
      ) : (
        <FlatList
          data={coinStats}
          keyExtractor={c => c.ticker}
          contentContainerStyle={s.list}
          renderItem={({ item }) => {
            const meta = COIN_META[item.ticker];
            return (
              <TouchableOpacity
                style={s.card}
                onPress={() => navigation.navigate('CoinDetail', { ticker: item.ticker })}
                activeOpacity={0.8}
              >
                {/* Top row: Icon + Name + Arrow */}
                <View style={s.cardTop}>
                  <View style={[s.iconWrap, { backgroundColor: meta.bg }]}>
                    <Text style={[s.emoji, { color: meta.color }]}>{meta.emoji}</Text>
                  </View>
                  <View style={s.coinNameWrap}>
                    <Text style={s.coinName}>{meta.name}</Text>
                    <Text style={[s.coinTicker, { color: meta.color }]}>{item.ticker}</Text>
                  </View>
                  <Text style={s.arrow}>→</Text>
                </View>

                {/* Average Price */}
                <View style={s.priceSection}>
                  <Text style={s.avgPrice}>
                    ${item.average.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={s.avgLabel}>Average Price</Text>
                </View>

                {/* Stats Row */}
                <View style={s.statsRow}>
                  <View style={s.statItem}>
                    <Text style={s.statValue}>
                      ${item.high.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <Text style={s.statLabel}>High ({item.highEx})</Text>
                  </View>
                  <View style={s.divider} />
                  <View style={s.statItem}>
                    <Text style={s.statValue}>
                      ${item.low.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <Text style={s.statLabel}>Low ({item.lowEx})</Text>
                  </View>
                  <View style={s.divider} />
                  <View style={s.statItem}>
                    <Text style={[s.statValue, { color: '#f7931a' }]}>
                      {item.spreadPct.toFixed(2)}%
                    </Text>
                    <Text style={s.statLabel}>Spread</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#05060f' },
  header:     { flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  logo:       { color: '#fff', fontSize: 18, fontWeight: '800' },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  dot:        { width: 6, height: 6, borderRadius: 3 },
  statusTxt:  { color: '#666', fontSize: 11 },
  logoutBtn:  { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  logoutTxt:  { color: 'rgba(255,255,255,0.6)', fontSize: 13 },

  hero:       { flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'center', paddingHorizontal: 20, marginVertical: 20 },
  heroTitle:  { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 4 },
  heroSub:    { color: '#666', fontSize: 13 },
  marketLink: { color: '#f7931a', fontSize: 13, fontWeight: '600', paddingRight: 8 },

  list:       { paddingHorizontal: 12, paddingBottom: 32 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingTxt: { color: '#666', fontSize: 14, marginTop: 12 },

  card:       { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12,
                padding: 16, marginBottom: 12, borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)' },
  cardTop:    { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconWrap:   { width: 44, height: 44, borderRadius: 8, justifyContent: 'center',
                alignItems: 'center', marginRight: 12 },
  emoji:      { fontSize: 24 },
  coinNameWrap: { flex: 1 },
  coinName:   { color: '#fff', fontSize: 15, fontWeight: '600' },
  coinTicker: { fontSize: 12, marginTop: 2 },
  arrow:      { color: '#f7931a', fontSize: 18, fontWeight: '600' },

  priceSection: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
                  paddingBottom: 12 },
  avgPrice:   { color: '#fff', fontSize: 22, fontWeight: '700' },
  avgLabel:   { color: '#666', fontSize: 12, marginTop: 2 },

  statsRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statItem:   { flex: 1, alignItems: 'center' },
  statValue:  { color: '#fff', fontSize: 13, fontWeight: '600' },
  statLabel:  { color: '#666', fontSize: 10, marginTop: 4 },
  divider:    { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 8 },
});