import { useEffect, useMemo, useState } from "react";

import { Button } from "../components/Button";
import { ButtonLink } from "../components/ButtonLink";
import { fetchGalleryImages, type GalleryImage } from "../services/supabase-images";
import styles from "./GalleryPage.module.css";

type GalleryFilter = "all" | "project" | "user";

const formatDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
};

export const GalleryPage = () => {
  const [activeFilter, setActiveFilter] = useState<GalleryFilter>("all");
  const [items, setItems] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      try {
        setIsLoading(true);
        const data = await fetchGalleryImages();
        setItems(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger la galerie pour le moment.");
      } finally {
        setIsLoading(false);
      }
    };

    loadImages();
  }, []);

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") {
      return items;
    }
    return items.filter((item) => item.source === activeFilter);
  }, [activeFilter, items]);

  const showEmptyState = !isLoading && filteredItems.length === 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Galerie du projet</h1>
        <p>
          Selectionne une image publiee ou filtre tes imports. Les images sont chargees dynamiquement depuis Supabase Storage.
        </p>
        <div className={styles.filters} role="toolbar" aria-label="Filtres galerie">
          {[
            { label: "Toutes", value: "all" },
            { label: "Projet", value: "project" },
            { label: "Mes imports", value: "user" }
          ].map((filter) => (
            <Button
              key={filter.value}
              variant="ghost"
              aria-pressed={activeFilter === filter.value}
              className={`${styles.filterButton} ${activeFilter === filter.value ? styles.filterButtonActive : ""}`}
              onClick={() => setActiveFilter(filter.value as GalleryFilter)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <p role="status">Chargement des images...</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : showEmptyState ? (
        <p role="status">Aucune image disponible pour ce filtre pour le moment.</p>
      ) : (
        <section className={styles.grid} aria-live="polite">
          {filteredItems.map((item) => (
            <article key={item.id} className={styles.card}>
              <div className={styles.thumbnail}>
                {item.publicUrl ? (
                  <img src={item.publicUrl} alt={`Illustration ${item.title}`} loading="lazy" />
                ) : null}
              </div>
              <div className={styles.cardBody}>
                <div>
                  <h2>{item.title}</h2>
                  <p className={styles.meta}>
                    <span>{item.source === "project" ? "Projet" : "Import"}</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </p>
                </div>
                <div className={styles.actions}>
                  <ButtonLink to={`/play/${item.id}`} variant="primary">
                    Jouer
                  </ButtonLink>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

