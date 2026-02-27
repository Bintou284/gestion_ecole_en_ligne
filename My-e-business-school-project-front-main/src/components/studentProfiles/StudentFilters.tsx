import { useState } from "react";
import {
  Card,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Box,
  alpha,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import { preferencesFinancement } from "../../utils/StudentShared";
import axios from "axios";

interface StudentFiltersProps {
  filterProgram: string;
  filterCity: string;
  filterFinance: string;
  programmesDisponibles: string[];
  profilsCount: number;
  onFiltersChange: (filters: { program: string; city: string; finance: string }) => void;
  onProfilsUpdate: (profils: any[]) => void;
  onShowSnackbar: (message: string, severity: "success" | "error" | "warning" | "info") => void;
}

/**
 * Composant gérant :
 * - les filtres des profils étudiants
 * - le chargement des résultats filtrés
 * - l’envoi de mails ciblés (via API ou via Gmail)
 */
export default function StudentFilters({
  filterProgram: initialProgram,
  filterCity: initialCity,
  filterFinance: initialFinance,
  programmesDisponibles,
  profilsCount,
  onFiltersChange,
  onProfilsUpdate,
  onShowSnackbar,
}: StudentFiltersProps) {
  // État local des filtres
  const [filterProgram, setFilterProgram] = useState(initialProgram);
  const [filterCity, setFilterCity] = useState(initialCity);
  const [filterFinance, setFilterFinance] = useState(initialFinance);

  // Gestion du formulaire d’envoi de mail
  const [showMailForm, setShowMailForm] = useState(false);
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");

  /**
   * Récupère les étudiants filtrés via l’API
   */
  const handleFilter = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/studentProfiles/filtered`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        params: {
          program: filterProgram || undefined,
          city: filterCity || undefined,
          finance: filterFinance || undefined,
        },
      });

      onProfilsUpdate(res.data); // envoie les profils filtrés au parent
      onFiltersChange({ program: filterProgram, city: filterCity, finance: filterFinance });
    } catch (err) {
      console.error("Erreur lors du filtrage :", err);
      onShowSnackbar("Erreur lors du chargement des profils filtrés", "error");
    }
  };

  /**
   * Réinitialise tous les filtres + recharge tous les profils
   */
  const handleReset = async () => {
    setFilterProgram("");
    setFilterCity("");
    setFilterFinance("");
    setShowMailForm(false);

    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/studentProfiles`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      onProfilsUpdate(res.data);
      onFiltersChange({ program: "", city: "", finance: "" });
    } catch (err) {
      console.error("Erreur lors du reset :", err);
      onShowSnackbar("Erreur lors du chargement des profils", "error");
    }
  };

  /**
   * Envoi d’un mail ciblé via API interne
   */
  const handleSendMail = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/email/send_group_email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: {
            program: filterProgram,
            city: filterCity,
            financing_preference: filterFinance,
          },
          subject: mailSubject,
          body: mailBody,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onShowSnackbar(`Mail envoyé à ${data.sentCount} étudiants`, "success");
        setShowMailForm(false);
        setMailSubject("");
        setMailBody("");
      } else {
        onShowSnackbar("Erreur lors de l'envoi du mail", "error");
      }
    } catch (error) {
      console.error(error);
      onShowSnackbar("Erreur serveur", "error");
    }
  };

  /**
   * Ouvre Gmail avec les emails filtrés pré-remplis
   */
  const handleOpenGmail = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/studentProfiles/filtered`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        params: {
          program: filterProgram || undefined,
          city: filterCity || undefined,
          finance: filterFinance || undefined,
        },
      });

      if (!res.data || res.data.length === 0) {
        onShowSnackbar("Aucun étudiant filtré !", "warning");
        return;
      }

      const to = res.data.map((p: any) => p.email).join(",");

      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        to
      )}&su=${encodeURIComponent("Message aux étudiants sélectionnés")}&body=${encodeURIComponent(
        "Bonjour, un message pour les étudiants concernés."
      )}`;

      window.open(gmailUrl, "_blank");
    } catch (err) {
      console.error("Erreur lors de l'ouverture Gmail :", err);
      onShowSnackbar("Erreur lors de la récupération des emails", "error");
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 4,
        p: 3,
        mb: 4,
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        border: "1px solid",
        borderColor: alpha("#D4AF37", 0.1),
      }}
    >
      {/* --- TITRE DES FILTRES --- */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <FilterListIcon sx={{ color: "#D4AF37" }} />
        <Typography variant="h6" fontWeight={700} sx={{ color: "#333" }}>
          Filtres de recherche
        </Typography>
      </Stack>

      {/* --- FILTRES --- */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        {/* Programme */}
        <FormControl fullWidth>
          <InputLabel>Programme souhaité</InputLabel>
          <Select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} label="Programme souhaité">
            <MenuItem value="">Tous</MenuItem>
            {programmesDisponibles.map((prog) => (
              <MenuItem key={prog} value={prog}>
                {prog}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Financement */}
        <FormControl fullWidth>
          <InputLabel>Préférence de financement</InputLabel>
          <Select value={filterFinance} onChange={(e) => setFilterFinance(e.target.value)} label="Préférence de financement">
            <MenuItem value="">Toutes</MenuItem>
            {preferencesFinancement.map((pref) => (
              <MenuItem key={pref} value={pref}>
                {pref}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Ville */}
        <TextField label="Ville" value={filterCity} onChange={(e) => setFilterCity(e.target.value)} fullWidth />
      </Stack>

      {/* --- Boutons filtrage / reset --- */}
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          onClick={handleFilter}
          sx={{
            background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
            color: "#fff",
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Filtrer
        </Button>

        <Button
          variant="outlined"
          onClick={handleReset}
          sx={{
            borderColor: "#D4AF37",
            color: "#D4AF37",
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Réinitialiser
        </Button>
      </Stack>

      {/* --- Boutons d’envoi d'email --- */}
      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button
          variant="contained"
          disabled={profilsCount === 0}
          onClick={() => setShowMailForm(true)}
          sx={{
            background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
            color: "#fff",
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Envoyer un mail ciblé via le site
        </Button>

        <Button
          variant="outlined"
          disabled={profilsCount === 0}
          onClick={handleOpenGmail}
          sx={{
            borderColor: "#D4AF37",
            color: "#D4AF37",
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Envoyer un mail ciblé via Gmail
        </Button>
      </Stack>

      {/* --- Formulaire d’envoi d’email interne --- */}
      {showMailForm && (
        <Box
          sx={{
            mt: 3,
            p: 3,
            border: `1px solid ${alpha("#D4AF37", 0.2)}`,
            borderRadius: 3,
            backgroundColor: alpha("#FFF9E5", 0.5),
          }}
        >
          <TextField
            label="Sujet du mail"
            fullWidth
            disabled={profilsCount === 0}
            value={mailSubject}
            onChange={(e) => setMailSubject(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Contenu du mail"
            fullWidth
            multiline
            rows={5}
            disabled={profilsCount === 0}
            value={mailBody}
            onChange={(e) => setMailBody(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            fullWidth
            disabled={profilsCount === 0}
            onClick={handleSendMail}
            sx={{
              background: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
              color: "#fff",
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Envoyer le mail
          </Button>
        </Box>
      )}
    </Card>
  );
}
