import { createBrowserRouter, createRoutesFromElements, Route } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { GalleryPage } from "../pages/GalleryPage";
import { HomePage } from "../pages/HomePage";
import { ImportPage } from "../pages/ImportPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PlayPage } from "../pages/PlayPage";

export const appRouter = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<AppLayout />}>
      <Route index element={<HomePage />} />
      <Route path="gallery" element={<GalleryPage />} />
      <Route path="import" element={<ImportPage />} />
      <Route path="play">
        <Route index element={<PlayPage />} />
        <Route path=":imageId" element={<PlayPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  )
);
