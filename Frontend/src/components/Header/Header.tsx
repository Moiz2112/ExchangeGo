import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import LoginModal from '../LoginModal/LoginModal';
import styles from './Header.module.css';
//import navStyles from "./Navbar.module.css";
import logo from "../../assets/fav.png"; 

const COINS = [
  { id: 'bitcoin',      ticker: 'BTC', name: 'Bitcoin',      emoji: '₿', color: '#f7931a' },
  { id: 'ethereum',     ticker: 'ETH', name: 'Ethereum',     emoji: 'Ξ', color: '#627eea' },
  { id: 'cardano',      ticker: 'ADA', name: 'Cardano',      emoji: '₳', color: '#3cc8c8' },
  { id: 'solana',       ticker: 'SOL', name: 'Solana',       emoji: '◎', color: '#9945ff' },
  { id: 'dogecoin',     ticker: 'DOGE',name: 'Dogecoin',     emoji: 'Ð', color: '#c2a633' },
  { id: 'ripple',       ticker: 'XRP', name: 'XRP',          emoji: '✕', color: '#00aae4' },
  { id: 'polkadot',     ticker: 'DOT', name: 'Polkadot',     emoji: '●', color: '#e6007a' },
  { id: 'litecoin',     ticker: 'LTC', name: 'Litecoin',     emoji: 'Ł', color: '#bebebe' },
  { id: 'bitcoin-cash', ticker: 'BCH', name: 'Bitcoin Cash', emoji: '₿', color: '#8dc351' },
  { id: 'chainlink',    ticker: 'LINK',name: 'Chainlink',    emoji: '⬡', color: '#2a5ada' },
];

export default function Header() {
  const { isLoggedIn, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [loginView, setLoginView] = useState<'signin' | 'signup'>('signin');
  const [coinsOpen, setCoinsOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setCoinsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close dropdown on route change
  useEffect(() => { setCoinsOpen(false); }, [location]);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const openLogin = (view: 'signin' | 'signup') => { setLoginView(view); setShowLogin(true); };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>

          {/* Logo — clicking goes to main dashboard (coin cards) */}
        <Link to="/" className={styles.logo}>
       <img 
         src={logo} 
         alt="ExchangeGo Logo" 
         className={styles.logoImage} 
       />
  <span className={styles.logoName}>ExchangeGo</span>
</Link>

          {/* Nav */}
          <nav className={styles.nav}>
            {/* Market — separate page */}
            <Link
              to="/market"
              className={`${styles.navItem} ${isActive('/market') ? styles.navActive : ''}`}
            >
              Market
            </Link>

            <div className={styles.navDivider} />

            {/* Coins — dropdown */}
            <div className={styles.dropWrap} ref={dropRef}>
              <button
                className={`${styles.navItem} ${styles.navBtn} ${coinsOpen ? styles.navActive : ''}`}
                onClick={() => setCoinsOpen(o => !o)}
              >
                Coins
                <svg className={`${styles.chevron} ${coinsOpen ? styles.chevronOpen : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {coinsOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropHeader}>Select a Coin</div>
                  {COINS.map(coin => (
                    <button
                      key={coin.id}
                      className={styles.dropItem}
                      onClick={() => { navigate(`/coin/${coin.id}`); setCoinsOpen(false); }}
                    >
                      <span className={styles.dropEmoji} style={{ color: coin.color }}>{coin.emoji}</span>
                      <span className={styles.dropName}>{coin.name}</span>
                      <span className={styles.dropTicker} style={{ color: coin.color }}>{coin.ticker}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.navDivider} />

            {/* About Us */}
            <Link
              to="/about"
              className={`${styles.navItem} ${isActive('/about') ? styles.navActive : ''}`}
            >
              About Us
            </Link>
          </nav>

          {/* Right */}
          <div className={styles.right}>
            {/* Theme toggle */}
            <button className={styles.themeBtn} onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {isLoggedIn ? (
              <div className={styles.userArea}>
                <div className={styles.avatar}>{user?.username.charAt(0).toUpperCase()}</div>
                <span className={styles.username}>{user?.username}</span>
                <button className={styles.logoutBtn} onClick={logout}>Sign Out</button>
              </div>
            ) : (
              <div className={styles.authBtns}>
                <button className={styles.loginBtn} onClick={() => openLogin('signin')}>Log In</button>
                <button className={styles.signupBtn} onClick={() => openLogin('signup')}>Sign Up</button>
              </div>
            )}
          </div>

        </div>
      </header>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} defaultView={loginView} />}
    </>
  );
}