import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useRates } from '../context/WebSocketContext';
import { COIN_META } from '../constants/coins';

const EXCHANGE_URLS: Record<string, string> = {
  Binance:   'https://www.binance.com/en/trade',
  Coinbase:  'https://www.coinbase.com/advanced-trade',
  Kraken:    'https://www.kraken.com/prices',
  Kucoin:    'https://www.kucoin.com/trade',
  Huobi:     'https://www.htx.com/trade',
  Bitfinex:  'https://trading.bitfinex.com',
  Bitstamp:  'https://www.bitstamp.net/markets',
  'Gate.io': 'https://www.gate.io/trade',
  OKX:       'https://www.okx.com/trade-spot',
};

export default function CoinDetailScreen() {
  const route      = useRoute<any>();
  const navigation = useNavigation<any>();
  const { ticker } = route.params;
  const { rates }  = useRates();
  const meta       = COIN_META[ticker];
  
  // Transform rates: { "Binance": { "BTC": {...}, "ETH": {...} } } 
  // to get data for this ticker
  const coinRates: Record<string, number> = {};
  Object.entries(rates).forEach(([exchange, coins]) => {
    if (coins[ticker]) {
      coinRates[exchange] = Number(coins[ticker].price);
    }
  });

  const exchanges  = Object.entries(coinRates);
  const prices     = Object.values(coinRates).filter(p => p > 0);
  const avg        = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const sorted     = [...exchanges].sort((a, b) => b[1] - a[1]);

  // Comparator
  const [exA, setExA] = useState('');
  const [exB, setExB] = useState('');
  const exchangeNames = exchanges.map(([name]) => name);

  const priceA   = exA ? coinRates[exA] ?? 0 : 0;
  const priceB   = exB ? coinRates[exB] ?? 0 : 0;
  const diff     = Math.abs(priceA - priceB);
  const pct      = priceA && priceB ? ((diff / Math.min(priceA, priceB)) * 100).toFixed(3) : null;
  const winner   = priceA > priceB ? exA : priceA < priceB ? exB : null;
  const cheaper  = priceA < priceB ? exA : priceA > priceB ? exB : null;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll}>

      {/* Back */}
      <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
        <Text style={s.backTxt}>← Back</Text>
      </TouchableOpacity>

      {/* Hero */}
      <View style={[s.hero, { borderColor: meta?.color + '33' }]}>
        <View style={[s.heroIcon, { backgroundColor: meta?.color + '22' }]}>
          <Text style={[s.heroEmoji, { color: meta?.color }]}>{meta?.emoji}</Text>
        </View>
        <View>
          <Text style={s.coinName}>{meta?.name ?? ticker}</Text>
          <Text style={[s.coinTicker, { color: meta?.color }]}>{ticker}</Text>
        </View>
        <View style={s.heroPrice}>
          <Text style={s.priceLabel}>AVG PRICE</Text>
          <Text style={[s.priceVal, { color: meta?.color }]}>
            ${avg > 0 ? avg.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
          </Text>
        </View>
      </View>

      {/* Exchange Comparison */}
      <Text style={s.sectionTitle}>EXCHANGE COMPARISON</Text>
      <View style={s.rankList}>
        {sorted.map(([exchange, price], idx) => {
          const diff2   = avg > 0 ? ((price - avg) / avg * 100) : 0;
          const isTop   = idx === 0;
          const isBot   = idx === sorted.length - 1;
          const url     = EXCHANGE_URLS[exchange];
          return (
            <View key={exchange} style={[s.rankItem, isTop && s.rankTop, isBot && s.rankBot]}>
              <Text style={[s.rankNum, isTop && { color: '#00ff88' }]}>#{idx + 1}</Text>
              <View style={s.rankInfo}>
                <TouchableOpacity onPress={() => url && Linking.openURL(url)}>
                  <Text style={[s.rankName, url && s.rankLink]}>
                    {exchange}{url ? ' ↗' : ''}
                  </Text>
                </TouchableOpacity>
                {isTop && <View style={s.badgeGreen}><Text style={s.badgeGreenTxt}>↑ Highest</Text></View>}
                {isBot && sorted.length > 1 && <View style={s.badgeRed}><Text style={s.badgeRedTxt}>↓ Lowest</Text></View>}
              </View>
              <View style={s.rankPrices}>
                <Text style={[s.rankPrice, isTop ? { color: '#00ff88' } : isBot && sorted.length > 1 ? { color: '#ff2d9b' } : { color: '#fff' }]}>
                  {price > 0 ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '…'}
                </Text>
                <Text style={[s.rankDiff, diff2 >= 0 ? { color: '#00ff88' } : { color: '#ff2d9b' }]}>
                  {diff2 >= 0 ? '+' : ''}{diff2.toFixed(3)}% vs avg
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Comparator */}
      <View style={s.comparator}>
        <Text style={s.comparatorTitle}>⚖️  Exchange Comparator</Text>
        <Text style={s.comparatorSub}>Select two exchanges to compare</Text>

        <View style={s.selectRow}>
          <View style={s.selectCol}>
            <Text style={s.selectLabel}>EXCHANGE A</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pills}>
              {exchangeNames.map(name => (
                <TouchableOpacity key={name} style={[s.pill, exA === name && s.pillActive]}
                  onPress={() => setExA(name)}>
                  <Text style={[s.pillTxt, exA === name && s.pillTxtActive]}>{name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {exA ? <Text style={s.selectedPrice}>${(coinRates[exA] ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text> : null}
          </View>

          <Text style={s.vs}>VS</Text>

          <View style={s.selectCol}>
            <Text style={s.selectLabel}>EXCHANGE B</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pills}>
              {exchangeNames.map(name => (
                <TouchableOpacity key={name} style={[s.pill, exB === name && s.pillActive]}
                  onPress={() => setExB(name)}>
                  <Text style={[s.pillTxt, exB === name && s.pillTxtActive]}>{name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {exB ? <Text style={s.selectedPrice}>${(coinRates[exB] ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text> : null}
          </View>
        </View>

        {winner && pct && (
          <View style={s.result}>
            <Text style={s.resultWinner}>👑 {winner} has the higher price</Text>
            <View style={s.resultStats}>
              <View style={s.resultStat}>
                <Text style={s.resultStatLabel}>DIFFERENCE</Text>
                <Text style={s.resultStatVal}>${diff.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={s.resultStat}>
                <Text style={s.resultStatLabel}>% DIFF</Text>
                <Text style={s.resultStatVal}>{pct}%</Text>
              </View>
              <View style={s.resultStat}>
                <Text style={s.resultStatLabel}>BUY ON</Text>
                <Text style={[s.resultStatVal, { color: '#00ff88' }]}>{cheaper}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#05060f' },
  scroll:          { padding: 20, paddingTop: 56, paddingBottom: 48 },
  back:            { marginBottom: 20 },
  backTxt:         { color: '#666', fontSize: 14 },
  hero:            { flexDirection: 'row', alignItems: 'center', gap: 16,
                     backgroundColor: '#0d1120', borderRadius: 16,
                     borderWidth: 1, padding: 20, marginBottom: 28 },
  heroIcon:        { width: 52, height: 52, borderRadius: 14,
                     alignItems: 'center', justifyContent: 'center' },
  heroEmoji:       { fontSize: 22 },
  coinName:        { color: '#fff', fontSize: 20, fontWeight: '700' },
  coinTicker:      { fontSize: 12, fontWeight: '700', marginTop: 2 },
  heroPrice:       { marginLeft: 'auto', alignItems: 'flex-end' },
  priceLabel:      { color: '#444', fontSize: 9, letterSpacing: 1, marginBottom: 3 },
  priceVal:        { fontSize: 18, fontWeight: '700' },
  sectionTitle:    { color: 'rgba(0,212,255,0.5)', fontSize: 10,
                     fontWeight: '700', letterSpacing: 2, marginBottom: 12 },
  rankList:        { gap: 10, marginBottom: 28 },
  rankItem:        { flexDirection: 'row', alignItems: 'center', gap: 12,
                     backgroundColor: '#0d1120', borderRadius: 12,
                     borderWidth: 1, borderColor: 'rgba(0,212,255,0.07)', padding: 16 },
  rankTop:         { backgroundColor: 'rgba(0,255,136,0.06)', borderColor: 'rgba(0,255,136,0.2)' },
  rankBot:         { backgroundColor: 'rgba(255,45,155,0.06)', borderColor: 'rgba(255,45,155,0.2)' },
  rankNum:         { color: '#444', fontSize: 13, fontWeight: '700', width: 28 },
  rankInfo:        { flex: 1, gap: 4 },
  rankName:        { color: '#fff', fontSize: 14, fontWeight: '700' },
  rankLink:        { color: '#00d4ff' },
  badgeGreen:      { backgroundColor: 'rgba(0,255,136,0.1)', borderWidth: 1,
                     borderColor: 'rgba(0,255,136,0.3)', borderRadius: 100,
                     paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  badgeGreenTxt:   { color: '#00ff88', fontSize: 10, fontWeight: '700' },
  badgeRed:        { backgroundColor: 'rgba(255,45,155,0.1)', borderWidth: 1,
                     borderColor: 'rgba(255,45,155,0.3)', borderRadius: 100,
                     paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  badgeRedTxt:     { color: '#ff2d9b', fontSize: 10, fontWeight: '700' },
  rankPrices:      { alignItems: 'flex-end' },
  rankPrice:       { fontSize: 15, fontWeight: '700' },
  rankDiff:        { fontSize: 11, fontWeight: '600', marginTop: 2 },
  comparator:      { backgroundColor: '#0a0a0a', borderRadius: 20, borderWidth: 1,
                     borderColor: 'rgba(247,147,26,0.2)', padding: 24 },
  comparatorTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  comparatorSub:   { color: '#444', fontSize: 12, marginBottom: 20 },
  selectRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  selectCol:       { flex: 1 },
  selectLabel:     { color: 'rgba(255,255,255,0.3)', fontSize: 9,
                     fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  pills:           { flexDirection: 'row' },
  pill:            { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8,
                     paddingHorizontal: 10, paddingVertical: 6,
                     marginRight: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  pillActive:      { backgroundColor: 'rgba(247,147,26,0.15)',
                     borderColor: 'rgba(247,147,26,0.4)' },
  pillTxt:         { color: '#666', fontSize: 11, fontWeight: '600' },
  pillTxtActive:   { color: '#f7931a' },
  selectedPrice:   { color: '#f7931a', fontSize: 16, fontWeight: '700', marginTop: 10 },
  vs:              { color: 'rgba(255,255,255,0.2)', fontSize: 11,
                     fontWeight: '800', marginTop: 28 },
  result:          { marginTop: 20, backgroundColor: 'rgba(255,255,255,0.03)',
                     borderRadius: 12, borderWidth: 1,
                     borderColor: 'rgba(255,255,255,0.07)', padding: 18 },
  resultWinner:    { color: '#f7931a', fontSize: 15, fontWeight: '700', marginBottom: 14 },
  resultStats:     { flexDirection: 'row', gap: 10 },
  resultStat:      { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)',
                     borderRadius: 10, padding: 12 },
  resultStatLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9,
                     fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  resultStatVal:   { color: '#f7931a', fontSize: 14, fontWeight: '700' },
});