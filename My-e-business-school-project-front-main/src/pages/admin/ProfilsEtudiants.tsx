import { useState, useEffect } from "react";
import {
  Container,
  Dialog,
  DialogContent,
  Box,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import axios from "axios";
import StudentDocuments from './StudentDocuments';
import { Snackbar } from "@mui/material";
import { useLocation } from "react-router-dom";
import StudentFilters from "../../components/studentProfiles/StudentFilters";
import StudentProfileCard from "../../components/studentProfiles/StudentProfileCard";
import type { ProfilEtudiant } from "../../types/student";
import StudentFormDialog from "../../components/studentProfiles/StudentFormDialog";
import PageHeader from "../../components/studentProfiles/PageHeader";

export default function ProfilsEtudiants() {
  const [profils, setProfils] = useState<ProfilEtudiant[]>([]);
  const [programmesDisponibles, setProgrammesDisponibles] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [refreshActivation, setRefreshActivation] = useState(0);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [selectedStudentForDocs, setSelectedStudentForDocs] = useState<{ id: number, name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const [filterProgram, setFilterProgram] = useState<string>("");
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterFinance, setFilterFinance] = useState<string>("");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  // Affiche un message Snackbar avec un niveau de sévérité (succès, erreur, info, etc.).
  const showSnackbar = (message: string, severity: "success" | "error" | "warning" | "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const location = useLocation();

  // Ouvre automatiquement le formulaire de création si la page a été appelée avec "openCreate".
  useEffect(() => {
    if (location.state?.openCreate) {
      handleOpenDialog();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Charge les profils étudiants et les formations disponibles depuis l’API.
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/studentProfiles`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }
        );
        setProfils(res.data);
      } catch (error) {
        console.error("Erreur lors du chargement des profils :", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchFormations = async () => {
      try {
        const res = await axios.get<{ title: string }[]>(
          `${import.meta.env.VITE_BACKEND_URL}/api/formations`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }
        );
        const titles = res.data.map((f) => f.title);
        setProgrammesDisponibles(titles);
      } catch (error) {
        console.error("Erreur lors du chargement des formations :", error);
      }
    };

    fetchProfiles();
    fetchFormations();
  }, [refreshActivation]);

  // Ouvre la fenêtre des documents d’un étudiant donné.
  const handleOpenDocuments = (profileId: number, studentName: string) => {
    setSelectedStudentForDocs({
      id: profileId,
      name: studentName
    });
    setDocumentsOpen(true);
  };

  // Ouvre le formulaire d’édition ou de création d’un profil étudiant.
  const handleOpenDialog = (profil: ProfilEtudiant | null = null) => {
    if (profil) {
      setEditId(profil.profile_id);
    } else {
      setEditId(null);
    }
    setOpenDialog(true);
  };

  // Ferme le formulaire de création/édition et réinitialise l’état courant.
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditId(null);
  };

  // Supprime un profil étudiant après confirmation et met à jour la liste.
  const handleDelete = async (id: number) => {
    if (window.confirm("Supprimer ce profil étudiant ?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/studentProfiles/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        setProfils((prev) => prev.filter((p) => p.profile_id !== id));
        console.log("Profil supprimé");
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        showSnackbar("Erreur lors de la suppression du profil.", "error");
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #FFF9E5 0%, #FFF3D0 100%)",
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        <PageHeader
          title="Gestion des Profils Étudiants"
          subtitle="Créez, modifiez et gérez les profils étudiants facilement"
          buttonLabel="Nouveau Profil Étudiant"
          onButtonClick={() => handleOpenDialog()}
        />

        <StudentFilters
          filterProgram={filterProgram}
          filterCity={filterCity}
          filterFinance={filterFinance}
          programmesDisponibles={programmesDisponibles}
          profilsCount={profils.length}
          onFiltersChange={({ program, city, finance }) => {
            setFilterProgram(program);
            setFilterCity(city);
            setFilterFinance(finance);
          }}
          onProfilsUpdate={setProfils}
          onShowSnackbar={showSnackbar}
        />

        {loading && profils.length === 0 ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress sx={{ color: "#D4AF37" }} />
          </Box>
        ) : profils.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Aucun profil étudiant disponible.
          </Alert>
        ) : (
          <Stack spacing={3}>
            {profils.map((profil, i) => (
              <StudentProfileCard
                key={profil.profile_id}
                profil={profil}
                index={i}
                onEdit={handleOpenDialog}
                onDelete={handleDelete}
                onOpenDocuments={handleOpenDocuments}
                onShowSnackbar={showSnackbar}
                refreshKey={refreshActivation}
                onRefreshActivation={(profileId) => {
                  setProfils(prev =>
                    prev.map(p =>
                      p.profile_id === profileId ? { ...p, status: "sent" } : p
                    )
                  );
                  setRefreshActivation(prev => prev + 1);
                }}
              />              
            ))}
          </Stack>
        )}

        <StudentFormDialog
          open={openDialog}
          onClose={handleCloseDialog}
          editProfile={editId !== null ? profils.find(p => p.profile_id === editId) || null : null}
          programmesDisponibles={programmesDisponibles}
          onProfileSaved={(profile, isEdit) => {
            if (isEdit) {
              setProfils(prev => prev.map(p => p.profile_id === profile.profile_id ? profile : p));
            } else {
              setProfils(prev => [...prev, profile]);
            }
          }}
          onShowSnackbar={showSnackbar}
        />

        <Dialog
          open={documentsOpen}
          onClose={() => setDocumentsOpen(false)}
          maxWidth="lg"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              height: '80vh',
              maxHeight: '800px'
            }
          }}
        >
          <DialogContent sx={{ p: 0, height: '100%' }}>
            {selectedStudentForDocs && (
              <StudentDocuments
                profileId={selectedStudentForDocs.id}
                studentName={selectedStudentForDocs.name}
                onClose={() => setDocumentsOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
}