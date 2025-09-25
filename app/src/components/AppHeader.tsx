import { NavLink } from "react-router-dom";
import clsx from "clsx";

import { ThemeToggle } from "./ThemeToggle";
import styles from "./AppHeader.module.css";

const links = [
  { to: "/", label: "Accueil" },
  { to: "/gallery", label: "Galerie" },
  { to: "/import", label: "Importer" }
];

export const AppHeader = () => {
  return (
    <header className={styles.header}>
      <a href="#main" className={styles.skipLink}>
        Aller au contenu
      </a>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span aria-hidden="true">PE</span>
          <span>Puzzle Eco</span>
        </div>
        <nav className={styles.nav} aria-label="Navigation principale">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                clsx(styles.navLink, isActive && styles.navLinkActive)
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.actions}>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
