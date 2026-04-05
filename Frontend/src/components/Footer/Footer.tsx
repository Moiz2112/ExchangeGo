import { useEffect, useState } from "react";
import styles from "./Footer.module.css";
import { Link } from "react-router-dom";

function Footer() {
  const [currentYear, setCurrentYear] = useState("");
  useEffect(() => {
    const year = new Date().getFullYear();
    setCurrentYear(year.toString());
  }, []);
  return (
    <>
      <footer className={`${styles.footer}`}>
        <div className={`container-fluid ${styles.footerContainer}`}>
          <div className="row">
            <div className="col-3 col-md-2">
              <ul className="list-unstyled mb-0">
                <li className={`${styles.footerSocial}`}>
                  <a href="https://www.linkedin.com/in/umarfarooqwaheed/" className="text-decoration-none">
                    LINKEDIN
                  </a>
                </li>
                <li className={`${styles.footerSocial}`}>
                  <a href="https://github.com/UmarFarooq-MP" target="_blank" className="text-decoration-none">
                    GITHUB
                  </a>
                </li>
                <li className={`${styles.footerSocial}`}>
                  <a href="https://twitter.com/0xffff_umar" className="text-decoration-none">
                    TWITTER
                  </a>
                </li>
                <li className={`${styles.footerSocial}`}>
                  <a href="#" className="text-decoration-none">
                    FIVERR
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-4 col-md-2">
              <ul className="list-unstyled mb-0">
                <li className={`${styles.footerSocial}`}>
                  <a href="#" className="text-decoration-none">
                    Portfolio
                  </a>
                </li>
                <li className={`${styles.footerSocial}`}>
                  <a
                    href="#"
                    className="text-decoration-none"
                  >
                    Contact
                  </a>
                </li>
                <li className={`${styles.footerSocial}`}>
                  <a href="#" className="text-decoration-none">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-4 col-sm-3  ms-auto">
              <p className={`mb-0 ${styles.footerCopyright}`}>
                ExchangeGo &copy; {currentYear}
                <br />
                All Right Reserved
              </p>
            </div>
            <div className="col-12">
              <Link to="/" className="text-decoration-none">
              <h2 className={`${styles.footerDomain}`}>
                <span className={styles.exchangeText}>Exchange</span> <span className={styles.goText}>GO</span>
              </h2>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;
