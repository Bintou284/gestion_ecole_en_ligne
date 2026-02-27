import { Outlet } from 'react-router-dom';
import NavbarFormateur from '../../components/NavbarFormateur.tsx';

export default function LayoutFormateur() {
  return (
    <>
      <NavbarFormateur />
      <main>
        <Outlet />
      </main>
    </>
  );
}