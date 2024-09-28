import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './ExchangeRatesTable.module.css';
import { setRates } from '../store/exchangeRatesSlice';
import { RootState } from '../store';

const ExchangeRatesTable = () => {
  const dispatch = useDispatch();
  const rates = useSelector((state: RootState) => state.exchangeRates);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const socket = new WebSocket(import.meta.env.VITE_API_URL);

    socket.onopen = () => {
      console.log('WebSocket connection opened');
      setLoading(false);
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('WebSocket Data:', message);

      if (message.data) {
        const exchange = message.data.exchange_name;
        const currencies = message.data.Currencies;

        // Dispatch rates to the Redux store
        dispatch(setRates({ exchange, currencies }));
      } else {
        console.error('Error: No data found in message');
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setLoading(false);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      socket.close();
    };
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;

  const allCurrencies = Array.from(new Set(Object.values(rates).flatMap(exchange => Object.keys(exchange))));

  return (
    <div>
      <table className={`${styles.mainTable}`}>
        <thead>
          <tr>
            <th className={`${styles.tableHeading}`}>Exchange</th>
            {allCurrencies.map((currency) => (
              <th className={`${styles.tableHeading}`} key={currency}>{currency}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(rates).map(([exchange, currencies]) => (
            <tr key={exchange} className={`${styles.tableRow}`}>
              <td className={styles.exchangeCell}>{exchange}</td>
              {allCurrencies.map((currency) => (
                <td key={currency} className={styles.currencyCell}>{currencies[currency] || 'N/A'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExchangeRatesTable;
