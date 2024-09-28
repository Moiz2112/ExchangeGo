import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Currency {
  name: string;
  price: string;
}

interface Rates {
  [exchange: string]: {
    [currency: string]: string;
  };
}

const initialState: Rates = {};

const exchangeRatesSlice = createSlice({
  name: 'exchangeRates',
  initialState,
  reducers: {
    setRates: (state, action: PayloadAction<{ exchange: string; currencies: Currency[] }>) => {
      const { exchange, currencies } = action.payload;
      state[exchange] = {};
      currencies.forEach(currency => {
        state[exchange][currency.name] = currency.price;
      });
    },
  },
});

export const { setRates } = exchangeRatesSlice.actions;

export default exchangeRatesSlice.reducer;
