import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1 px-4 pt-4 pb-24 max-w-md w-full mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
