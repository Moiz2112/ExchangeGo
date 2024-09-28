import { Outlet } from 'react-router-dom';
import Header from './components/Header/Header';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer/Footer';


function App() {

  return (
    <>
      <Header />
      <ScrollToTop />
      <Outlet />
      <Footer />
    </>
  )
}

export default App
