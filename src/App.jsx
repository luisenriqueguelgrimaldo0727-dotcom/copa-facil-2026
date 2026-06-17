import MainPage from './pages/MainPage';
import AuthPage from './pages/AuthPage';
import useTournamentStore from './store/useTournamentStore';
import { useEffect } from 'react';

function App() {
  const currentUser = useTournamentStore((state) => state.currentUser);
  const startCloudSync = useTournamentStore((state) => state.startCloudSync);

  useEffect(() => {
    startCloudSync();
  }, [startCloudSync]);

  return currentUser ? <MainPage /> : <AuthPage />;
}

export default App;
