import { Outlet } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import WebSocketProvider from './components/WebSocketProvider';

export default function App() {
  return (
    <>
      <Header />
      <WebSocketProvider />
      <Outlet />
      <Footer />
    </>
  );
}