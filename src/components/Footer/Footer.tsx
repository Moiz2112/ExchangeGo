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
                  <a href="https://www.linkedin.com/in/umarfarooqwaheed/" className="text-decoration-none text-white">
                    LINKEDIN
                  </a>
                </li>
                <li className={`${styles.footerSocial}`}>
                  <a href="https://github.com/UmarFarooq-MP" target="_blank" className="text-decoration-none text-white">
                    GITHUB
                  </a>
                </li>
                <li className={`${styles.footerSocial}`}>
                  <a href="https://twitter.com/0xffff_umar" className="text-decoration-none text-white">
                    TWITTER
                  </a>
                </li>
                <li className={`${styles.footerSocial}`}>
                  <a href="#" className="text-decoration-none text-white">
                    FIVERR
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-4 col-md-2">
              <ul className="list-unstyled mb-0">
                <li className={`${styles.footerSocial}`}>
                  <a href="#" className="text-decoration-none text-white">
                    Portfolio
                  </a>
                </li>
                <li className={`${styles.footerSocial}`}>
                  <a
                    href="#"
                    className="text-decoration-none text-white"
                  >
                    Contact
                  </a>
                </li>
                <li className={`${styles.footerSocial}`}>
                  <a href="#" className="text-decoration-none text-white">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-4 col-sm-3  ms-auto">
              <p className={`mb-0 ${styles.footerCopyright}`}>
                Coinstrove &copy; {currentYear}
                <br />
                All Right Reserved
              </p>
            </div>
            <div className="col-12">
              <Link to="/" className="text-decoration-none">
              <h2 className={`${styles.footerDomain}`}>
                COINSTROVE
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
