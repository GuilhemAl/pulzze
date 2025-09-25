import styles from "./AppFooter.module.css";

export const AppFooter = () => (
  <footer className={styles.footer}>
    <div className={styles.inner}>
      <p>
        Projet pedagogique eco-responsable. Code source et documentation disponibles dans le repertoire du projet.
      </p>
      <div className={styles.links}>
        <a href="https://vercel.com" target="_blank" rel="noreferrer">
          Vercel
        </a>
        <a href="https://supabase.com" target="_blank" rel="noreferrer">
          Supabase
        </a>
        <a href="mailto:contact@puzzle-eco.test">
          Contact equipe
        </a>
      </div>
    </div>
  </footer>
);

