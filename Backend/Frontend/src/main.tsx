import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './pages/Home';
import Market from './pages/Market';
import CoinDetail from './pages/CoinDetail';
import Compare from './pages/Compare';
import About from './pages/About';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import AdminPage from './pages/Admin/AdminPage';
import store from './store';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const savedTheme = localStorage.getItem('exchangego_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '',             element: <Home /> },
      { path: 'market',       element: <Market /> },
      { path: 'compare',      element: <Compare /> },
      { path: 'coins',        element: <Home /> },
      { path: 'coin/:coinId', element: <CoinDetail /> },
      { path: 'about',        element: <About /> },
      { path: 'contact',      element: <Contact /> },
      { path: 'profile',      element: <Profile /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminPage />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>
);