import { Outlet } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import WebSocketProvider from './components/WebSocketProvider';
import ChatBot from './components/ChatBot/ChatBot';

export default function App() {
  return (
    <>
      <Header />
      <WebSocketProvider />
      <Outlet />
      <Footer />
      <ChatBot />
    </>
  );
}