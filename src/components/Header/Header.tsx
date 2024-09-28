import { useEffect } from "react";
import styles from "./Header.module.css";
import { Link, useLocation } from "react-router-dom";

function Header() {
  const location = useLocation();

  useEffect(() => {
    const stickyHeader = document.querySelector<HTMLElement>(".csHeader");
    if (stickyHeader) {
      stickyHeader.style.top = "-100%";
    }
  }, [location]);

  const DisplayHeader = () => {
    const stickyHeader = document.querySelector<HTMLElement>(".csHeader");
    if (stickyHeader) {
      stickyHeader.style.top = "0%";
    }
  };
  return (
    <>
      <header className={`${styles.Header} d-flex align-items-center`}>
        <div className="container-fluid">
          <div className="row">
            <div className="col-11 m-auto">
              <div className="row">
                <div className="col-6">
                  <Link to="/" className="text-decoration-none">
                  <h4 className={`mb-0 text-white ${styles.logo}`}>
                    CoinStrove
                  </h4>
                  </Link>
                </div>
                <div className="col-6 align-self-center">
                  <div className="d-flex justify-content-end">
                    <div
                      className={`d-flex headerMenuBtn align-items-center ms-auto ${styles.headerMenuButton}`}
                      onClick={DisplayHeader}
                    >
                      <h5
                        className={`text-end text-white mb-0 me-2 ${styles.csHamburger}`}
                      >
                        MENU
                      </h5>
                      <img
                        src="/assets/svg/Menu-icon.svg"
                        alt="Code Shifu"
                        className={`${styles.topHeaderIcon}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
