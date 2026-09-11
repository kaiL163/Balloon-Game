import { Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { GameScene } from './pages/GameScene';
import { ThemeSelectPage } from './pages/ThemeSelectPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ThemeSelectPage />} />
        <Route path="bet" element={<GameScene />} />
        <Route path="*" element={<GameScene />} />
      </Route>
    </Routes>
  );
}
