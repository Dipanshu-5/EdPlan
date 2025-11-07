import { Outlet } from 'react-router-dom';
import Navigation from './Navigation.jsx';

const AppLayout = () => (
  <div className="min-h-screen flex flex-col lg:flex-row bg-slate-100 text-slate-900">
    <Navigation />
    <main className="flex-1 w-full min-h-screen overflow-y-auto">
      <Outlet />
    </main>
  </div>
);

export default AppLayout;
