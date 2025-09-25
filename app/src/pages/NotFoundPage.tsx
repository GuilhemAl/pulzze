import { ButtonLink } from "../components/ButtonLink";
import styles from "./NotFoundPage.module.css";

export const NotFoundPage = () => (
  <div className={styles.page}>
    <h1 className={styles.title}>Page introuvable</h1>
    <p className={styles.text}>
      La page demandee est peut-etre en construction. Retourne a l'accueil pour continuer a jouer.
    </p>
    <ButtonLink to="/" variant="primary">
      Retour accueil
    </ButtonLink>
  </div>
);
