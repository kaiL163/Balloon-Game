import { Navigate, Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { BetPage } from './pages/BetPage';
import { GamePage } from './pages/GamePage';
import { ResultPage } from './pages/ResultPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<BetPage />} />
        <Route path="game" element={<GamePage />} />
        <Route path="result" element={<ResultPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
