import { Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { GameScene } from './pages/GameScene';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="*" element={<GameScene />} />
      </Route>
    </Routes>
  );
}
