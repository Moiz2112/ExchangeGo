import styles from "./Footer.module.css";
import { Link } from "react-router-dom";
import logo from "../../assets/exchangego.png";

import {
  FaGithub,
  FaInstagram,
  FaFacebook,
  FaLinkedin,
  FaTwitter,
  FaEnvelope,
  FaBriefcase
} from "react-icons/fa";

import { useState } from "react";

function Footer() {
  //const [showCoins, setShowCoins] = useState(false);
  const [productCoins, setProductCoins] = useState(false);
  const [pagesCoins, setPagesCoins] = useState(false);


  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className="row">

          {/* PRODUCT */}
          <div className="col-md-2 ">
            <h5 className={styles.heading}>Product</h5>

            <ul className={styles.list}>
              <li><Link to="/" target="_blank">Dashboard</Link></li>
              <li><Link to="/market" target="_blank">Market</Link></li>

              {/* Dropdown */}
              <li>
               <span 
                className={styles.dropdownToggle}
                onClick={() => setProductCoins(!productCoins)}
                 >
                  Coins ▾
                </span>

                {productCoins  && (
                  <ul className={styles.dropdown}>
                    <li><Link to="/coin/bitcoin">Bitcoin</Link></li>
                    <li><Link to="/coin/ethereum">Ethereum</Link></li>
                    <li><Link to="/coin/cardano">Cardano</Link></li>
                    <li><Link to="/coin/solana">Solana</Link></li>
                    <li><Link to="/coin/dogecoin">Dogecoin</Link></li>
                    <li><Link to="/coin/ripple">XRP</Link></li>
                    <li><Link to="/coin/polkadot">Polkadot</Link></li>
                    <li><Link to="/coin/litecoin">Litecoin</Link></li>
                    <li><Link to="/coin/bitcoin-cash">Bitcoin Cash</Link></li>
                    <li><Link to="/coin/chainlink">Chainlink</Link></li>
                  </ul>
                )}
              </li>
            </ul>
          </div>

          {/* SOCIAL MEDIA */}
          <div className="col-md-3 mb-4">
            <h5 className={styles.heading}>Social Media</h5>

          <ul className={styles.socialGrid}>
            <li><a href="mailto:murrehman212@gmail.com" target="_blank" className={styles.socialItem}>
         <FaEnvelope /> Mail</a></li> 
            <li> <a href="https://web.facebook.com/moiz.urrahman.351" target="_blank" className={styles.socialItem}>
         <FaFacebook /> Facebook</a></li> 
            <li> <a href="https://x.com/MoizRehman50720" target="_blank" className={styles.socialItem}>
         <FaTwitter /> Twitter</a></li> 
            <li> <a href="https://www.instagram.com/_moiz_ur_rehman_/?hl=en"  target="_blank" className={styles.socialItem}>
         <FaInstagram /> Instagram</a></li> 
            <li> <a href="https://www.linkedin.com/in/moiz-ur-rehman-53b69a280/" target="_blank" className={styles.socialItem}>
         <FaLinkedin /> LinkedIn</a></li> 
            <li> <a href="https://www.upwork.com/freelancers/~014210f22d94e3b9a0" target="_blank" className={styles.socialItem}><FaBriefcase />Upwork</a></li> 
            <li><a href="https://github.com/Moiz2112" target="_blank" className={styles.socialItem}>
         <FaGithub /> Github</a></li>
            </ul>
          </div>

          {/* PAGES */}
          <div className="col-md-3 mb-5">
            <h5 className={styles.heading}>Pages</h5>

            <ul className={styles.list}>
              <li><Link to="/" target="_blank">Dashboard</Link></li>
              <li><Link to="/market" target="_blank">Market</Link></li>
              <li>  {/* Dropdown */}
              <li>
              <span 
              className={styles.dropdownToggle1}
              onClick={() => setPagesCoins(!pagesCoins)}
              >
                  Coins ▾
                </span>

                {pagesCoins  && (
                   <ul className={styles.dropdown}>
                    <li><Link to="/coin/bitcoin">Bitcoin</Link></li>
                    <li><Link to="/coin/ethereum">Ethereum</Link></li>
                    <li><Link to="/coin/cardano">Cardano</Link></li>
                    <li><Link to="/coin/solana">Solana</Link></li>
                    <li><Link to="/coin/dogecoin">Dogecoin</Link></li>
                    <li><Link to="/coin/ripple">XRP</Link></li>
                    <li><Link to="/coin/polkadot">Polkadot</Link></li>
                    <li><Link to="/coin/litecoin">Litecoin</Link></li>
                    <li><Link to="/coin/bitcoin-cash">Bitcoin Cash</Link></li>
                    <li><Link to="/coin/chainlink">Chainlink</Link></li>
                  </ul>
                )}
              </li></li>
            </ul>
          </div>

          {/* LOGO RIGHT */}
          <div className="col-md-3 text-md-end text-center">
            <img src={logo} alt="ExchangeGO" className={styles.logo} />
          </div>
      {/* Copyright */}
       <div className="text-right ">
       <p className={styles.footerCopyright}>
         © {new Date().getFullYear()} ExchangeGO. All Rights Reserved.
       </p>
       </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;