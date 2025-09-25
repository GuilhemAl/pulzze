import styles from "./HomePage.module.css";
import { ButtonLink } from "../components/ButtonLink";

const features = [
  {
    title: "Eco-conception",
    description: "Images optimisees, poids controle et zero tracking pour limiter l'empreinte."
  },
  {
    title: "Apprentissage ludique",
    description: "Puzzles simples pour initier aux gestes eco et stimuler la curiosite."
  },
  {
    title: "Accessibilite",
    description: "Navigation clavier, focus visibles et contrastes AA par defaut."
  }
];

export const HomePage = () => (
  <div className={styles.page}>
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <p className="visually-hidden">Accueil Puzzle Eco</p>
        <h1 className={styles.heroTitle}>Assemble ton puzzle eco-responsable</h1>
        <p className={styles.heroText}>
          Choisis une image inspiree de la nature, importe tes photos ou explore la galerie du projet.
          Assemble les pieces et decouvre un message positif.
        </p>
        <div className={styles.heroActions}>
          <ButtonLink to="/gallery">Jouer</ButtonLink>
          <ButtonLink to="/import" variant="secondary">
            Importer une image
          </ButtonLink>
          <ButtonLink to="/play/demo" variant="ghost">
            Voir une demo
          </ButtonLink>
        </div>
      </div>
      <div className={styles.heroIllustration} aria-hidden="true" />
    </section>

    <section aria-labelledby="features-heading" className={styles.features}>
      <h2 id="features-heading" className="visually-hidden">
        Engagements de la plateforme
      </h2>
      {features.map((feature) => (
        <article key={feature.title} className={styles.featureCard}>
          <h3 className={styles.featureTitle}>{feature.title}</h3>
          <p className={styles.featureText}>{feature.description}</p>
        </article>
      ))}
    </section>
  </div>
);
