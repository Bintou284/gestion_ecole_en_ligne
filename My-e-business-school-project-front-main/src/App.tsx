import { Routes, Route, Navigate } from 'react-router-dom'

// Auth
import RequireAuth from './auth/RequireAuth' 

// Pages publiques
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

//Activation compte
import ActivateAccount from "./pages/ActivateAccount";

import Profile from './pages/Profile';

// Layouts
import LayoutEtudiant from './pages/etudiant/LayoutEtudiant'
import FormateurLayout from './pages/formateur/FormateurLayout'
import LayoutAdmin from './pages/admin/LayoutAdmin'

// Étudiant
import AccueilEtudiant from './pages/etudiant/Accueil'
import CalendrierEtudiant from './pages/etudiant/Calendrier'
import NotesEtudiant from './pages/etudiant/Notes'
import ModulesEtudiant from './pages/etudiant/Modules'
import ModuleDetailsEtudiant from './pages/etudiant/ModuleDetails'
import ProfileStudent from './pages/etudiant/ProfileStudent';

// Formateur
import Apercu from './pages/formateur/Apercu'
import Cours from './pages/formateur/Cours'
import Notes from './pages/formateur/Notes'
import Apprenants from './pages/formateur/Apprenants'
import CourseDetail from './pages/formateur/CourseDetail';
import ProfileFormateur from './pages/formateur/ProfileFormateur';

// Admin
import Apercuadmin from './pages/admin/Apercu'
import ProfilsEtudiants from './pages/admin/ProfilsEtudiants'
import Modulesadmin from './pages/admin/Modules'
import Programmesadmin from './pages/admin/Programmes'
import Enseignantsadmin from './pages/admin/Enseignants'
import Planningadmin from './pages/admin/Planning'
import AdminValidateResource from './pages/admin/AdminValidateResource';
import CalendrierFormateur from './pages/formateur/CalendrierFormateur'
import ProfileAdmin from './pages/admin/ProfileAdmin';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Activation de compte */}
      <Route path="/activate" element={<ActivateAccount />} />

      {/* Route de redirection pour le profil */}
      <Route path="/profile" element={<Profile />} />

      {/* Étudiant */}
      <Route
        path="/etudiant/*"
        element={
          <RequireAuth allow={['student']}>
            <LayoutEtudiant />
          </RequireAuth>
        }
      >
        <Route index element={<AccueilEtudiant />} />
        <Route path="accueil" element={<AccueilEtudiant />} />
        <Route path="calendrier" element={<CalendrierEtudiant />} />
        <Route path="notes" element={<NotesEtudiant />} />
        <Route path="modules" element={<ModulesEtudiant />} />
        <Route path="modules/:courseId" element={<ModuleDetailsEtudiant />} />
        <Route path="profilestudent" element={<ProfileStudent />} />
      </Route>

      {/* Formateur */}
      <Route
        path="/formateur/*"
        element={
          <RequireAuth allow={['teacher']}>
            <FormateurLayout />
          </RequireAuth>
        }
      >
        <Route path="cours/:id" element={<CourseDetail />} />
        <Route index element={<Apercu />} />
        <Route path="apercu" element={<Apercu />} />
        <Route path="cours" element={<Cours />} />
        <Route path="notes" element={<Notes />} />
        <Route path="apprenants" element={<Apprenants />} />
        <Route path="planning" element={<CalendrierFormateur/>} />
        <Route path="profileformateur" element={<ProfileFormateur />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin/*"
        element={
          <RequireAuth allow={['admin']}>
            <LayoutAdmin />
          </RequireAuth>
        }
      >
        <Route index element={<Apercuadmin />} />
        <Route path="apercu" element={<Apercuadmin />} />
        <Route path="profils-etudiants" element={<ProfilsEtudiants />} />
        <Route path="modules" element={<Modulesadmin />} />
        <Route path="programmes" element={<Programmesadmin />} />
        <Route path="enseignants" element={<Enseignantsadmin />} />
        <Route path="planning" element={<Planningadmin />} />
        <Route path="validations/ressources" element={<AdminValidateResource />} />
        <Route path="profileadmin" element={<ProfileAdmin />} />
      </Route>

      {/* Fallbacks */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}