import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { Button } from "../components/Button";
import { uploadUserImage, saveImageMetadata } from "../services/supabase-images";
import { processImageFile } from "../services/image-processing";
import styles from "./ImportPage.module.css";

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

const normaliseTitle = (fileName: string) =>
  fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\s{2,}/g, " ")
    .slice(0, 80);

export const ImportPage = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const resetSelection = () => {
    clearFileSelection();
    setError(null);
    setSuccess(null);
  };

  const handleSelectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Format non supporte. Utilise JPG ou PNG.");
      clearFileSelection();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Fichier trop lourd (> 5 Mo).");
      clearFileSelection();
      return;
    }

    setError(null);
    setSuccess(null);
    setSelectedFile(file);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDropzoneClick = () => {
    inputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Selectionne d'abord une image.");
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      setError(null);
      setSuccess(null);

      const processed = await processImageFile(selectedFile);
      const title = normaliseTitle(selectedFile.name) || "Image utilisateur";

      const { publicUrl, storagePath } = await uploadUserImage({
        blob: processed.blob,
        fileName: title,
        onProgress: (value) => setProgress(Math.round(value * 100))
      });

      await saveImageMetadata({
        title,
        storage_path: storagePath,
        source: "user",
        status: "published",
        width: processed.width,
        height: processed.height,
        size_bytes: selectedFile.size,
        content_type: "image/webp"
      });

      setSuccess(`Image importee et validee. URL : ${publicUrl}`);
      clearFileSelection();
    } catch (uploadError) {
      console.error(uploadError);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Une erreur est survenue pendant l'import."
      );
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Importer une image</h1>
        <p>
          Formats acceptes JPG ou PNG. Taille maximale 5 Mo avant compression. Un recadrage carre automatique est applique pour un rendu optimal (1920 px max).
        </p>
      </header>

      <section className={styles.uploadCard}>
        <button
          type="button"
          className={styles.dropzone}
          onClick={handleDropzoneClick}
          disabled={isProcessing}
        >
          <strong>Glisse ton image ici</strong>
          <span>ou clique pour parcourir tes fichiers</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="visually-hidden"
          onChange={handleSelectFile}
        />

        <div className={styles.requirements}>
          <h2>Etapes de traitement</h2>
          <ul>
            <li>Compression client en WebP &lt;= 1920 px (recadrage carre centre).</li>
            <li>Upload vers Supabase Storage (bucket puzzles).</li>
            <li>Enregistrement metadata dans la table `images`.</li>
          </ul>
        </div>

        <div className={styles.previewArea}>
          <div className={styles.previewBox}>
            {previewUrl ? (
              <img src={previewUrl} alt="Apercu de l'image selectionnee" />
            ) : (
              <span>Aucune image importee pour le moment.</span>
            )}
          </div>
          {selectedFile ? <p>{selectedFile.name}</p> : null}
          {isProcessing && (
            <p role="status">Traitement en cours... {progress}%</p>
          )}
          {error ? (
            <p role="alert">{error}</p>
          ) : success ? (
            <p role="status">{success}</p>
          ) : null}
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={resetSelection} disabled={isProcessing && !error}>
            Reinitialiser
          </Button>
          <Button variant="primary" disabled={!selectedFile || isProcessing} onClick={handleUpload}>
            {isProcessing ? "Import en cours" : "Continuer"}
          </Button>
        </div>
      </section>
    </div>
  );
};


