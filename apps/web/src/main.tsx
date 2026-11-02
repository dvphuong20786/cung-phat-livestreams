import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { Landmark, FlaskConical } from 'lucide-react';
import App from './App';
import { useSocket } from './hooks/useSocket';
import './index.css';
import './game/mobile2d.css';
import './game/interaction-effects.css';
const TemplePage = lazy(() =>
  import('./pages/TemplePage').then((module) => ({ default: module.TemplePage })),
);
const Mobile2DOverlayPage = lazy(() =>
  import('./pages/Mobile2DOverlayPage').then((module) => ({ default: module.Mobile2DOverlayPage })),
);
const TestPage = lazy(() =>
  import('./pages/TestPage').then((module) => ({ default: module.TestPage })),
);
function GameRoute({ children }: { children: React.ReactNode }) {
  useSocket();
  return (
    <Suspense
      fallback={
        <div className="grid h-screen place-items-center bg-slate-950 text-amber-100">
          Đang dựng không gian chùa 3D…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
function Root() {
  const path = window.location.pathname;
  if (path === '/temple')
    return (
      <GameRoute>
        <TemplePage />
      </GameRoute>
    );
  if (path === '/overlay')
    return (
      <GameRoute>
        <TemplePage overlay />
      </GameRoute>
    );
  if (path === '/overlay-mobile')
    return (
      <GameRoute>
        <TemplePage overlay mobile />
      </GameRoute>
    );
  if (path === '/overlay-2d')
    return (
      <GameRoute>
        <Mobile2DOverlayPage mobile={false} />
      </GameRoute>
    );
  if (path === '/overlay-mobile-2d')
    return (
      <GameRoute>
        <Mobile2DOverlayPage />
      </GameRoute>
    );
  if (path === '/test')
    return (
      <GameRoute>
        <TestPage />
      </GameRoute>
    );
  return (
    <>
      <App />
      <div className="fixed bottom-5 right-5 z-50 flex gap-2">
        <a
          href="/test"
          className="btn border border-white/10 bg-slate-900/90 text-slate-200 shadow-xl"
        >
          <FlaskConical size={17} /> Thử nghiệm 3D
        </a>
        <a
          href="/temple"
          className="btn bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-xl shadow-orange-950/40"
        >
          <Landmark size={17} /> Mở chùa 3D
        </a>
      </div>
    </>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
