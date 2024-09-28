import ExchangeRatesTable from "../components/ExchangeRatesTable"
import styles from './Home.module.css'


function Home() {
  return (
    <>
    <section className={`${styles.exchangeTable} px-5`}>
    <ExchangeRatesTable />
    </section>
    </>
  )
}

export default Home