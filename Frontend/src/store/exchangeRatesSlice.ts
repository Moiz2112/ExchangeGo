import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CoinRates {
  [exchange: string]: {
    price: string;
    prevPrice?: string;
  };
}

export interface Rates {
  [coin: string]: CoinRates;
}

const initialState: Rates = {};

const exchangeRatesSlice = createSlice({
  name: 'exchangeRates',
  initialState,
  reducers: {
    mergeRates: (state, action: PayloadAction<Rates>) => {
      const incoming = action.payload;
      Object.entries(incoming).forEach(([coin, exchanges]) => {
        if (!state[coin]) state[coin] = {};
        Object.entries(exchanges).forEach(([exchange, data]) => {
          const existing = state[coin][exchange];
          state[coin][exchange] = {
            price: data.price,
            prevPrice: existing?.price ?? data.price,
          };
        });
      });
    },
  },
});

export const { mergeRates } = exchangeRatesSlice.actions;
export default exchangeRatesSlice.reducer;