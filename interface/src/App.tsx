import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/protected-route";
import { LandingPage } from "@/pages/landing";
import { ExplorePage } from "@/pages/explore";
import { AboutPage } from "@/pages/about";
import { LoginPage } from "@/pages/login";
import { SignupPage } from "@/pages/signup";
import { DashboardPage } from "@/pages/dashboard";
import { PlayerPage } from "@/pages/player";
import { RecorderPage } from "@/pages/recorder";
import { NotFoundPage } from "@/pages/not-found";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<LandingPage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route
          path="mytoia"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="record"
          element={
            <ProtectedRoute>
              <RecorderPage />
            </ProtectedRoute>
          }
        />
        <Route path="stream/:id" element={<PlayerPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
