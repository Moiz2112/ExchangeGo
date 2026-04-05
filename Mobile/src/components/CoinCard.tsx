import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COIN_META } from '../constants/coins';

interface Exchange {
  price: number;
  exchange: string;
}

interface CoinCardProps {
  ticker: string;
  exchanges: Record<string, { price: number; exchange: string }>;
  onPress: () => void;
}

export default function CoinCard({ ticker, exchanges, onPress }: CoinCardProps) {
  const meta = COIN_META[ticker];
  
  if (!meta) return null;

  // Get all prices
  const validExchanges = Object.entries(exchanges).filter(([, e]) => Number(e.price) > 0);
  const prices = validExchanges.map(([, e]) => Number(e.price));
  
  const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const hi = prices.length ? Math.max(...prices) : 0;
  const lo = prices.length ? Math.min(...prices) : 0;
  const spread = ((hi - lo) / avg * 100).toFixed(2);

  return (
    <TouchableOpacity 
      style={[s.card, { borderLeftColor: meta.color }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Header: Emoji + Name */}
      <View style={s.header}>
        <View style={[s.iconWrap, { backgroundColor: meta.bg }]}>
          <Text style={s.emoji}>{meta.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.coinName}>{meta.name}</Text>
          <Text style={s.ticker}>{ticker}</Text>
        </View>
      </View>

      {/* Price */}
      <Text style={[s.price, { color: meta.color }]}>${avg.toFixed(2)}</Text>
      <Text style={s.priceLabel}>Avg Price</Text>

      {/* Hi/Lo */}
      <View style={s.hiLoRow}>
        <View style={s.hiLoItem}>
          <Text style={s.hiLoLabel}>High</Text>
          <Text style={[s.hiLoPrice, { color: meta.color }]}>${hi.toFixed(2)}</Text>
        </View>
        <View style={s.divider} />
        <View style={s.hiLoItem}>
          <Text style={s.hiLoLabel}>Low</Text>
          <Text style={[s.hiLoPrice, { color: meta.color }]}>${lo.toFixed(2)}</Text>
        </View>
      </View>

      {/* Spread */}
      <View style={s.spreadRow}>
        <Text style={s.spreadLabel}>Spread</Text>
        <Text style={[s.spreadPct, { color: meta.color }]}>{spread}%</Text>
      </View>

      {/* Exchanges count */}
      <View style={s.footer}>
        <Text style={s.exchangeCount}>{validExchanges.length} exchanges</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#0f1419',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 20,
    fontWeight: '600',
  },
  coinName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  ticker: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  priceLabel: {
    color: '#555',
    fontSize: 11,
    marginBottom: 10,
  },
  hiLoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  hiLoItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  hiLoLabel: {
    color: '#666',
    fontSize: 11,
    marginBottom: 4,
  },
  hiLoPrice: {
    fontSize: 12,
    fontWeight: '700',
  },
  spreadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  spreadLabel: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
  },
  spreadPct: {
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  exchangeCount: {
    color: '#666',
    fontSize: 11,
  },
});
