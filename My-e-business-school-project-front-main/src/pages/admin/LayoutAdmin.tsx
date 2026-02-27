import { Outlet } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar.tsx';

export default function LayoutAdmin() {
  return (
    <>
      <AdminNavbar />
      <main style={{ padding: '20px' }}>
        <Outlet />
      </main>
    </>
  );
}
