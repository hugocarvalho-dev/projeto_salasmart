import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./app/App.tsx";
import RoomsIndex from "./app/RoomsIndex.tsx";
import { ROOMS } from "./app/rooms.ts";
import UserPortal from "./app/UserPortal.tsx";
import LoginPage from "./app/LoginPage.tsx";
import NotFound from "./app/NotFound.tsx";
import { AuthProvider } from "./app/auth.tsx";
import RequireAuth from "./app/RequireAuth.tsx";
import ErrorBoundary from "./app/ErrorBoundary.tsx";
import { queryClient } from "./lib/queryClient.ts";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<RoomsIndex />} />
              {ROOMS.map((r) => (
                <Route key={r.slug} path={`/${r.slug}`} element={<App room={r.label} />} />
              ))}
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/gestao"
                element={
                  <RequireAuth requireManagement>
                    <UserPortal />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
