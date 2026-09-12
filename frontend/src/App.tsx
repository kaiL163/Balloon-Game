import { Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { RequireAdmin } from './components/RequireAdmin';
import { AdminPage } from './pages/AdminPage';
import { AuthPage } from './pages/AuthPage';
import { GameScene } from './pages/GameScene';
import { ThemeSelectPage } from './pages/ThemeSelectPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="login" element={<AuthPage />} />
        <Route element={<RequireAuth />}>
          <Route index element={<ThemeSelectPage />} />
          <Route path="bet" element={<GameScene />} />
          <Route element={<RequireAdmin />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<GameScene />} />
        </Route>
      </Route>
    </Routes>
  );
}
