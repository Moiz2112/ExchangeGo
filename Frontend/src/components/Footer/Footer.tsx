import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBitcoin,
  FaChartLine,
  FaCommentDots,
  FaEnvelope,
  FaGithub,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
} from 'react-icons/fa';
import logo from '../../assets/fav.png';
import styles from './Footer.module.css';

const COINS = [
  { id: 'bitcoin', label: 'Bitcoin' },
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'cardano', label: 'Cardano' },
  { id: 'solana', label: 'Solana' },
  { id: 'dogecoin', label: 'Dogecoin' },
  { id: 'ripple', label: 'XRP' },
  { id: 'polkadot', label: 'Polkadot' },
  { id: 'litecoin', label: 'Litecoin' },
  { id: 'bitcoin-cash', label: 'Bitcoin Cash' },
  { id: 'chainlink', label: 'Chainlink' },
];

function Footer() {
  const [coinsOpen, setCoinsOpen] = useState(false);

  const openChatbot = () => {
    window.dispatchEvent(new Event('coinstrove:open-chatbot'));
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brandCol}>
            <Link to="/" className={styles.brand}>
              <img src={logo} alt="Coinstrove" className={styles.brandLogo} />
              <span className={styles.brandText}>Coinstrove</span>
            </Link>
            <p className={styles.description}>
              Coinstrove brings live crypto prices, exchange comparisons, and fast market insights together in one place.
            </p>

            <div className={styles.socialRow}>
              <a href="https://github.com/Moiz2112" target="_blank" rel="noreferrer" className={styles.socialBtn} aria-label="GitHub">
                <FaGithub />
              </a>
              <a href="https://x.com/MoizRehman50720" target="_blank" rel="noreferrer" className={styles.socialBtn} aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="https://www.linkedin.com/in/moiz-ur-rehman-53b69a280/" target="_blank" rel="noreferrer" className={styles.socialBtn} aria-label="LinkedIn">
                <FaLinkedin />
              </a>
              <a href="https://www.instagram.com/_moiz_ur_rehman_/" target="_blank" rel="noreferrer" className={styles.socialBtn} aria-label="Instagram">
                <FaInstagram />
              </a>
            </div>
          </div>

          <div className={styles.linksCol}>
            <h5 className={styles.heading}>Quick Links</h5>
            <ul className={styles.linkList}>
              <li><Link to="/market">Market</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><button type="button" className={styles.linkButton} onClick={openChatbot}>Chatbot</button></li>
              <li><Link to="/" onClick={() => setCoinsOpen(false)}>Dashboard</Link></li>
            </ul>
          </div>

          <div className={styles.linksCol}>
            <h5 className={styles.heading}>Explore</h5>
            <ul className={styles.linkList}>
              <li><button type="button" className={styles.linkButton} onClick={openChatbot}><FaCommentDots /> Open Chatbot</button></li>
              <li><Link to="/market"><FaChartLine /> Live Market</Link></li>
              <li><Link to="/compare">Compare Exchanges</Link></li>
              <li>
                <button type="button" className={styles.dropdownToggle} onClick={() => setCoinsOpen(o => !o)}>
                  Coins <span className={styles.chevron}>{coinsOpen ? '▴' : '▾'}</span>
                </button>
                {coinsOpen && (
                  <ul className={styles.dropdown}>
                    {COINS.map(coin => (
                      <li key={coin.id}><Link to={`/coin/${coin.id}`}>{coin.label}</Link></li>
                    ))}
                  </ul>
                )}
              </li>
            
            </ul>
          </div>

          <div className={styles.contactCol}>
            <h5 className={styles.heading}>Contact Us</h5>
            <div className={styles.contactList}>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}><FaCommentDots /></span>
                <div>
                  <p>Chat support</p>
                  <button type="button" className={styles.contactAction} onClick={openChatbot}>Open assistant</button>
                </div>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}><FaEnvelope /></span>
                <div>
                  <p>Support</p>
                  <Link to="/contact">Submit a ticket</Link>
                </div>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}><FaBitcoin /></span>
                <div>
                  <p>Markets</p>
                  <Link to="/market">View live prices</Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} Coinstrove. All rights reserved.</p>
          <div className={styles.bottomLinks}>
            <Link to="/about">About Us</Link>
            <Link to="/market">Market</Link>
            <Link to="/">Dashboard</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
