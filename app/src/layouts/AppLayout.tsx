import { Outlet } from "react-router-dom";

import { AppFooter } from "../components/AppFooter";
import { AppHeader } from "../components/AppHeader";
import styles from "./AppLayout.module.css";

export const AppLayout = () => (
  <div className={styles.appShell}>
    <AppHeader />
    <main id="main" className={styles.main}>
      <Outlet />
    </main>
    <AppFooter />
  </div>
);
