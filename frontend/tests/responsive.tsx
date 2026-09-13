// Local visual fixtures, served by Vite only. Not imported by the application.
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { App } from '../src/App';
import { gameApi, MockGameApi } from '../src/api';
import { mockHistory } from '../src/api/mockHistory';
import '../src/styles/global.css';
import '../src/styles/responsive.css';

const query = new URLSearchParams(location.search);
if (!import.meta.env.DEV) throw new Error('Visual fixtures are development-only');
const screen = query.get('screen') ?? '/';
const mock = new MockGameApi({ storage: { getItem: () => null, setItem: () => {} } });
for (const method of Object.getOwnPropertyNames(MockGameApi.prototype)) {
  const implementation = Reflect.get(mock, method);
  if (method !== 'constructor' && typeof implementation === 'function') {
    Object.defineProperty(gameApi, method, { value: implementation.bind(mock), writable: true, configurable: true });
  }
}
gameApi.getHistory = async () => mockHistory;
gameApi.getResult = async () => mockHistory[0].result;
if (screen === '/game') {
  const round = { ...mockHistory[2].round, status: 'active' as const, baseMultiplier: 2.4, multiplier: 2.4,
    cashoutMultiplier: null, reachedLevel: 3, boosterLevel: 6, boosterState: 'WAITING' as const };
  gameApi.getActiveRound = async () => round;
  gameApi.subscribeToRound = () => () => {};
}
if (screen === '/loading') gameApi.getProfile = () => new Promise(() => {});
// This isolated preview uses no real session or server writes.
const settings = { gameId:'preview',gameName:'Воздушный шар',gameType:'CRASH',active:true,
  crashDistribution:'INVERSE_RTP',houseEdge:.03,minCrashMultiplier:1,greenMaxMultiplier:10,redMaxMultiplier:25,
  multiplierGrowthRate:.12,fps:10,delta:.1,greenBoosterProbabilities:Array(9).fill(1),redBoosterProbabilities:Array(12).fill(1),
  multiplierTier1Value:1,multiplierTier2Value:2,multiplierTier3Value:3,multiplierTier4Value:4,
  betTier1Amount:100,betTier2Amount:200,betTier3Amount:300,betTier4Amount:400,
  pointsPerLine:10,pointsCashoutBonus:20,pointsXnBonus:20,updatedAt:'',boosterTierValues:[1,2,3,4],betTierAmounts:[100,200,300,400] };
window.fetch = async () => new Response(JSON.stringify(settings), { headers: { 'Content-Type':'application/json' } });
const previousToken = localStorage.getItem('balloon-auth-token');
const previousUser = localStorage.getItem('balloon-auth-user');
if (screen === '/login') localStorage.removeItem('balloon-auth-token');
else localStorage.setItem('balloon-auth-token','local-visual-fixture');
localStorage.setItem('balloon-auth-user',JSON.stringify({ id:0,username:'preview',role:'ADMIN' }));
window.addEventListener('pagehide', () => {
  for (const [key,value] of [['balloon-auth-token',previousToken],['balloon-auth-user',previousUser]]) {
    if (value === null) localStorage.removeItem(key); else localStorage.setItem(key,value);
  }
});
createRoot(document.getElementById('root')!).render(<MemoryRouter initialEntries={[screen]}><App /></MemoryRouter>);
