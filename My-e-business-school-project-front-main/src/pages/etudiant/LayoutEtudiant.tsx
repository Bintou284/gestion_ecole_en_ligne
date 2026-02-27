import React from 'react';
import { Outlet } from 'react-router-dom';
import Mainnavbar from '../../components/Mainnavbar.tsx';

export default function LayoutEtudiant() {
  return (
    <>
      <Mainnavbar />
      <main>
        <Outlet />
      </main>
    </>
  );
}