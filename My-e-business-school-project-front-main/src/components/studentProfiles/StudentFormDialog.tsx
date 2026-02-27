// src/components/student-profiles/StudentFormDialog.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  Slider,
  Stack,
  Typography,
  Button,
  IconButton,
  alpha,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import { initialFormState, type ProfilEtudiant } from "../../types/student";
import { niveauxEtudes, niveauxAnglais, preferencesFinancement } from "../../utils/StudentShared";

interface StudentFormDialogProps {
  open: boolean;
  onClose: () => void;
  editProfile: ProfilEtudiant | null;
  programmesDisponibles: string[];
  onProfileSaved: (profile: ProfilEtudiant, isEdit: boolean) => void;
  onShowSnackbar: (message: string, severity: "success" | "error" | "warning") => void;
}

export default function StudentFormDialog({
  open,
  onClose,
  editProfile,
  programmesDisponibles,
  onProfileSaved,
  onShowSnackbar,
}: StudentFormDialogProps) {
  const [formState, setFormState] = useState<Omit<ProfilEtudiant, "profile_id">>(initialFormState);
  const [cvFile, setCvFile] = useState<File | null>(null);

  useEffect(() => {
    if (editProfile) {
      setFormState({ ...editProfile });
    } else {
      setFormState(initialFormState);
    }
    setCvFile(null);
  }, [editProfile, open]);

  const handleInputChange = (field: keyof typeof formState, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (!formState.city || !formState.desired_program || !formState.email) {
        onShowSnackbar("La ville, le mail et le programme souhaité sont obligatoires.", "warning");
        return;
      }

      const formData = new FormData();

      Object.entries(formState).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else if (typeof value === 'boolean') {
            formData.append(key, String(value));
          } else if (typeof value === 'number') {
            formData.append(key, String(value));
          } else {
            formData.append(key, value);
          }
        }
      });

      if (cvFile) {
        formData.append("cv_file", cvFile);
      }

      let res: { data: ProfilEtudiant };
      const isEdit = editProfile !== null;

      if (isEdit) {
        res = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/api/studentProfiles/${editProfile.profile_id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/studentProfiles`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      onProfileSaved(res.data, isEdit);
      onClose();
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement du profil :", error);
      onShowSnackbar(
        `Erreur lors de l'enregistrement du profil: ${error.response?.data?.error || error.message}`,
        "error"
      );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        {editProfile ? "Modifier le Profil Étudiant" : "Ajouter un Profil Étudiant"}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ maxHeight: "70vh", overflowY: "auto" }}>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Informations personnelles */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: "#D4AF37", fontWeight: 700 }}>
              Informations personnelles
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                label="Prénom *"
                sx={{ minWidth: 200 }}
                value={formState.first_name}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
              />
              <TextField
                label="Nom *"
                sx={{ minWidth: 200 }}
                value={formState.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
              />
              <TextField
                label="Email *"
                type="email"
                sx={{ minWidth: 250 }}
                value={formState.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
              <TextField
                label="Téléphone *"
                sx={{ minWidth: 200 }}
                value={formState.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
              <TextField
                label="Date de naissance"
                type="date"
                sx={{ minWidth: 200 }}
                InputLabelProps={{ shrink: true }}
                value={
                  formState.birth_date
                    ? formState.birth_date instanceof Date
                      ? formState.birth_date.toISOString().split("T")[0]
                      : new Date(formState.birth_date).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => handleInputChange("birth_date", new Date(e.target.value))}
              />
              <TextField
                label="Lieu de naissance"
                sx={{ minWidth: 200 }}
                value={formState.birth_place}
                onChange={(e) => handleInputChange("birth_place", e.target.value)}
              />
              <TextField
                label="Adresse"
                sx={{ minWidth: 300 }}
                value={formState.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
              <TextField
                label="Code postal"
                sx={{ minWidth: 150 }}
                value={formState.postal_code}
                onChange={(e) => handleInputChange("postal_code", e.target.value)}
              />
              <TextField
                label="Ville"
                sx={{ minWidth: 200 }}
                value={formState.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
              />
            </Box>
          </Box>

          {/* Informations académiques */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: "#D4AF37", fontWeight: 700 }}>
              Informations académiques
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                label="Situation actuelle"
                sx={{ minWidth: 250 }}
                value={formState.situation}
                onChange={(e) => handleInputChange("situation", e.target.value)}
                placeholder="Ex: Étudiant, Salarié, Demandeur d'emploi..."
              />
              <FormControl sx={{ minWidth: 250 }}>
                <InputLabel>Programme souhaité *</InputLabel>
                <Select
                  value={formState.desired_program}
                  onChange={(e) => handleInputChange("desired_program", e.target.value)}
                  label="Programme souhaité *"
                >
                  {programmesDisponibles.map((prog) => (
                    <MenuItem key={prog} value={prog}>
                      {prog}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Date de début souhaitée"
                type="date"
                sx={{ minWidth: 200 }}
                InputLabelProps={{ shrink: true }}
                value={
                  formState.desired_start_date
                    ? formState.desired_start_date instanceof Date
                      ? formState.desired_start_date.toISOString().split("T")[0]
                      : new Date(formState.desired_start_date).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => handleInputChange("desired_start_date", new Date(e.target.value))}
              />
            </Box>
          </Box>

          {/* Formation et compétences */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: "#D4AF37", fontWeight: 700 }}>
              Formation et compétences
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap" sx={{ mb: 2 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Plus haut niveau d'études</InputLabel>
                <Select
                  value={formState.highest_degree}
                  onChange={(e) => handleInputChange("highest_degree", e.target.value)}
                  label="Plus haut niveau d'études"
                >
                  {niveauxEtudes.map((niveau) => (
                    <MenuItem key={niveau} value={niveau}>
                      {niveau}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Nom du diplôme"
                sx={{ minWidth: 250 }}
                value={formState.degree_name}
                onChange={(e) => handleInputChange("degree_name", e.target.value)}
              />
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Niveau d'anglais</InputLabel>
                <Select
                  value={formState.english_level}
                  onChange={(e) => handleInputChange("english_level", e.target.value)}
                  label="Niveau d'anglais"
                >
                  {niveauxAnglais.map((niveau) => (
                    <MenuItem key={niveau} value={niveau}>
                      {niveau}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formState.handicap}
                  onChange={(e) => handleInputChange("handicap", e.target.checked)}
                />
              }
              label="Situation de handicap"
            />
          </Box>

          {/* Projet professionnel */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: "#D4AF37", fontWeight: 700 }}>
              Projet professionnel
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Projet professionnel"
                multiline
                rows={3}
                fullWidth
                value={formState.professional_project}
                onChange={(e) => handleInputChange("professional_project", e.target.value)}
              />
              <TextField
                label="Vision à 5 ans"
                multiline
                rows={3}
                fullWidth
                value={formState.five_year_vision}
                onChange={(e) => handleInputChange("five_year_vision", e.target.value)}
              />
              <Box display="flex" gap={2} flexWrap="wrap">
                <TextField
                  label="Métiers souhaités"
                  sx={{ minWidth: 300 }}
                  value={formState.desired_jobs}
                  onChange={(e) => handleInputChange("desired_jobs", e.target.value)}
                />
                <TextField
                  label="Zone de mobilité"
                  sx={{ minWidth: 200 }}
                  value={formState.mobility_zone}
                  onChange={(e) => handleInputChange("mobility_zone", e.target.value)}
                />
                <TextField
                  label="Type d'entreprise préféré"
                  sx={{ minWidth: 200 }}
                  value={formState.company_type_preference}
                  onChange={(e) => handleInputChange("company_type_preference", e.target.value)}
                />
              </Box>
              <TextField
                label="Expérience professionnelle"
                multiline
                rows={2}
                fullWidth
                value={formState.professional_experience}
                onChange={(e) => handleInputChange("professional_experience", e.target.value)}
              />
            </Stack>
          </Box>

          {/* Alternance */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: "#D4AF37", fontWeight: 700 }}>
              Alternance et financement
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formState.found_apprenticeship}
                    onChange={(e) => handleInputChange("found_apprenticeship", e.target.checked)}
                  />
                }
                label="Alternance trouvée"
              />
              <TextField
                label="Pistes d'alternance"
                sx={{ minWidth: 250 }}
                value={formState.apprenticeship_leads}
                onChange={(e) => handleInputChange("apprenticeship_leads", e.target.value)}
              />
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Préférence de financement</InputLabel>
                <Select
                  value={formState.financing_preference}
                  onChange={(e) => handleInputChange("financing_preference", e.target.value)}
                  label="Préférence de financement"
                >
                  {preferencesFinancement.map((pref) => (
                    <MenuItem key={pref} value={pref}>
                      {pref}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={formState.guarantee_place}
                    onChange={(e) => handleInputChange("guarantee_place", e.target.checked)}
                  />
                }
                label="Place garantie"
              />
            </Box>
          </Box>

          {/* Expérience en ligne */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: "#D4AF37", fontWeight: 700 }}>
              Expérience d'apprentissage en ligne
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={formState.prior_online_courses}
                    onChange={(e) => handleInputChange("prior_online_courses", e.target.checked)}
                  />
                }
                label="Cours en ligne antérieurs"
              />
              <TextField
                label="Expérience en ligne"
                sx={{ minWidth: 300 }}
                value={formState.online_experience}
                onChange={(e) => handleInputChange("online_experience", e.target.value)}
              />
              <TextField
                label="Préférence d'apprentissage"
                sx={{ minWidth: 200 }}
                value={formState.learning_preference}
                onChange={(e) => handleInputChange("learning_preference", e.target.value)}
                placeholder="Hybride, Présentiel, Distanciel..."
              />
              <TextField
                label="Confort avec le campus virtuel"
                sx={{ minWidth: 200 }}
                value={formState.comfort_virtual_campus}
                onChange={(e) => handleInputChange("comfort_virtual_campus", e.target.value)}
              />
            </Box>
          </Box>

          {/* Compétences techniques */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: "#D4AF37", fontWeight: 700 }}>
              Compétences techniques et équipement
            </Typography>
            <Box display="flex" gap={3} flexWrap="wrap" alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={formState.has_computer}
                    onChange={(e) => handleInputChange("has_computer", e.target.checked)}
                  />
                }
                label="Possède un ordinateur"
              />
              <TextField
                label="Qualité de la connexion internet"
                sx={{ minWidth: 250 }}
                value={formState.internet_quality}
                onChange={(e) => handleInputChange("internet_quality", e.target.value)}
                placeholder="Excellente, Bonne, Moyenne..."
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formState.quiet_study_space}
                    onChange={(e) => handleInputChange("quiet_study_space", e.target.checked)}
                  />
                }
                label="Espace d'étude calme"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formState.previous_technical_issues}
                    onChange={(e) => handleInputChange("previous_technical_issues", e.target.checked)}
                  />
                }
                label="Problèmes techniques antérieurs"
              />
            </Box>
          </Box>

          {/* Évaluations */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: "#D4AF37", fontWeight: 700 }}>
              Auto-évaluations
            </Typography>
            <Box display="flex" gap={4} flexWrap="wrap">
              <Box sx={{ minWidth: 300 }}>
                <Typography gutterBottom sx={{ fontWeight: 600 }}>
                  Auto-évaluation campus virtuel: {formState.self_evaluation_virtual_campus}/10
                </Typography>
                <Slider
                  value={formState.self_evaluation_virtual_campus}
                  onChange={(_, value) => handleInputChange("self_evaluation_virtual_campus", value)}
                  min={1}
                  max={10}
                  marks
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{
                    color: "#D4AF37",
                    "& .MuiSlider-thumb": { bgcolor: "#D4AF37" }
                  }}
                />
              </Box>
              <Box sx={{ minWidth: 300 }}>
                <Typography gutterBottom sx={{ fontWeight: 600 }}>
                  Note d'attente du programme: {formState.program_expectation_rating}/10
                </Typography>
                <Slider
                  value={formState.program_expectation_rating}
                  onChange={(_, value) => handleInputChange("program_expectation_rating", value)}
                  min={1}
                  max={10}
                  marks
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{
                    color: "#D4AF37",
                    "& .MuiSlider-thumb": { bgcolor: "#D4AF37" }
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Informations complémentaires */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: "#D4AF37", fontWeight: 700 }}>
              Informations complémentaires
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap" sx={{ mb: 2 }}>
              <TextField
                label="Centres d'intérêt"
                sx={{ minWidth: 300 }}
                value={formState.interests}
                onChange={(e) => handleInputChange("interests", e.target.value)}
                placeholder="Ex: IA, Marketing, Entrepreneuriat..."
              />
              <TextField
                label="Loisirs"
                sx={{ minWidth: 300 }}
                value={formState.hobbies}
                onChange={(e) => handleInputChange("hobbies", e.target.value)}
                placeholder="Ex: Lecture, Sport, Voyage..."
              />
              <TextField
                label="Qualités"
                sx={{ minWidth: 300 }}
                value={formState.qualities}
                onChange={(e) => handleInputChange("qualities", e.target.value)}
                placeholder="Ex: Rigoureux, Créatif, Persévérant..."
              />
              <TextField
                label="Points à améliorer"
                sx={{ minWidth: 300 }}
                value={formState.weaknesses}
                onChange={(e) => handleInputChange("weaknesses", e.target.value)}
                placeholder="Ex: Gestion du temps, Prise de parole..."
              />
            </Box>
            <TextField
              label="Lien CV / Notes"
              fullWidth
              value={formState.resume}
              onChange={(e) => handleInputChange("resume", e.target.value)}
              placeholder="Lien LinkedIn, Google Drive, ou notes..."
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: '#D4AF37',
            color: '#D4AF37',
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              borderColor: '#C5A028',
              bgcolor: alpha("#D4AF37", 0.05)
            }
          }}
        >
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
            color: "#fff",
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
            px: 3,
            boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #C5A028 0%, #B08020 100%)",
            },
          }}
        >
          {editProfile ? "Modifier le Profil" : "Ajouter le Profil"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}