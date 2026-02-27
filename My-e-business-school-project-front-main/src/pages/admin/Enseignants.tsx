import { useState, useEffect } from "react";
import {
  Container, Typography, Card, CardContent, Button,
  Dialog, DialogTitle, DialogContent, TextField, DialogActions,
  IconButton, Box, Chip, Stack, Select, MenuItem, FormControl,
  InputLabel, Grid, Snackbar, Alert, CircularProgress, alpha
} from "@mui/material";
import { motion } from "framer-motion";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import SchoolIcon from '@mui/icons-material/School';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useLocation } from "react-router-dom";
import axios from "axios";

interface Enseignant {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  specialite: string;
  phone: string;
  address?: string;
  postal_code?: string;
  city?: string;
  dateEmbauche: string;
  statut: 'actif' | 'inactif';
  formations: number[];
}


type Status = "pending" | "sent" | "activated";

interface AccountStatusProps {
  profileId: number;
  refreshKey?: number;
}

export function AccountStatus({ profileId, refreshKey }: AccountStatusProps) {
  const [status, setStatus] = useState<Status>("pending");

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/userstatus/account-status/${profileId}`, {
        withCredentials: true,
      });
      setStatus(res.data.status);
    } catch (err: any) {
      console.error(`[AccountStatus] Erreur API:`, err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [profileId, refreshKey]);

  let color = "#9e9e9e";
  let bgColor = alpha("#9e9e9e", 0.15);
  let message = "En attente";

  if (status === "sent") {
    color = "#ff9800";
    bgColor = alpha("#ff9800", 0.15);
    message = "Email envoyé";
  } else if (status === "activated") {
    color = "#4caf50";
    bgColor = alpha("#4caf50", 0.15);
    message = "Compte activé";
  }

  return (
    <Chip
      label={message}
      size="small"
      sx={{
        bgcolor: bgColor,
        color: color,
        fontWeight: 700,
        borderRadius: 2,
        border: 'none',
        mt: 0
      }}
    />
  );
}


interface Formation {
  id: number;
  title: string;
}

interface CoursReel {
  course_id: number;
  title: string;
  teacher_id?: number;
  teacher_name?: string;
  formation_courses: {
    formations: {
      formation_id: number;
      title: string;
    };
  }[];
  sessions: {
    session_id: number;
    start_time: string;
    end_time: string;
  }[];
}

// ==================== GESTION D'AUTHENTIFICATION ====================

const decodeToken = (token: string) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch (error) {
    return null;
  }
};

const isTokenValid = (token: string): boolean => {
  try {
    const payload = decodeToken(token);
    if (!payload || !payload.exp) return false;
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const bufferTime = 5 * 60 * 1000;
    return expirationTime - currentTime > bufferTime;
  } catch (error) {
    return false;
  }
};

const performLogin = async (): Promise<{ success: boolean; token?: string; error?: string }> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'test.admin@ecampus.com',
        password: 'Admin1234!'
      }),
    });

    if (!response.ok) {
      //const errorText = await response.text();
      let errorMessage = 'Erreur de connexion';
      if (response.status === 401) {
        errorMessage = 'Identifiants incorrects';
      }
      return { success: false, error: errorMessage };
    }

    const { token, user } = await response.json();
    if (!token) {
      return { success: false, error: 'Aucun token reçu' };
    }

    localStorage.setItem('token', token);
    return { success: true, token };

  } catch (error) {
    return { success: false, error: 'Erreur réseau' };
  }
};

const ensureValidToken = async (): Promise<boolean> => {
  const token = localStorage.getItem('token');
  if (!token || !isTokenValid(token)) {
    const loginResult = await performLogin();
    return loginResult.success;
  }
  return true;
};

const withRetry = async (
  operation: () => Promise<any>,
  maxRetries: number = 2,
  delayMs: number = 1000
): Promise<any> => {
  let lastError: Error;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  throw lastError!;
};

// ==================== SERVICE API ====================

const apiService = {
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const hasValidToken = await ensureValidToken();
    if (!hasValidToken) {
      throw new Error('Impossible de se connecter au serveur');
    }

    const token = localStorage.getItem('token');
    const defaultOptions: RequestInit = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, finalOptions);
      if (response.ok) {
        return response;
      }

      if (response.status === 401) {
        localStorage.removeItem('token');
        const reconnected = await ensureValidToken();
        if (!reconnected) {
          throw new Error('Session expirée - Impossible de se reconnecter');
        }

        const newToken = localStorage.getItem('token');
        const retryOptions = {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
          },
        };

        const retryResponse = await fetch(url, { ...defaultOptions, ...retryOptions });
        if (!retryResponse.ok) {
          throw new Error(`Erreur ${retryResponse.status}: ${await retryResponse.text()}`);
        }
        return retryResponse;
      }

      const errorText = await response.text();
      throw new Error(`Erreur ${response.status}: ${errorText}`);

    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erreur réseau - Vérifiez votre connexion');
      }
      throw error;
    }
  },

  async getEnseignants(): Promise<Enseignant[]> {
    return withRetry(async () => {
      const response = await this.makeAuthenticatedRequest(`${import.meta.env.VITE_BACKEND_URL}/api/teachers`);
      return response.json();
    });
  },

  async createEnseignant(enseignant: Omit<Enseignant, 'id'>): Promise<Enseignant> {
    return withRetry(async () => {
      const response = await this.makeAuthenticatedRequest(`${import.meta.env.VITE_BACKEND_URL}/api/teachers`, {
        method: 'POST',
        body: JSON.stringify(enseignant),
      });
      return response.json();
    });
  },

  async updateEnseignant(id: number, enseignant: Partial<Enseignant>): Promise<Enseignant> {
    return withRetry(async () => {
      const response = await this.makeAuthenticatedRequest(`${import.meta.env.VITE_BACKEND_URL}/api/teachers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(enseignant),
      });
      return response.json();
    });
  },

  async deleteEnseignant(id: number): Promise<void> {
    return withRetry(async () => {
      await this.makeAuthenticatedRequest(`${import.meta.env.VITE_BACKEND_URL}/api/teachers/${id}`, {
        method: 'DELETE',
      });
    });
  },

  async getEnseignantDetails(id: number): Promise<any> {
    return withRetry(async () => {
      const response = await this.makeAuthenticatedRequest(`${import.meta.env.VITE_BACKEND_URL}/api/teachers/${id}`);
      return response.json();
    });
  },

  async getFormationsDisponibles(): Promise<Formation[]> {
    return withRetry(async () => {
      const response = await this.makeAuthenticatedRequest(`${import.meta.env.VITE_BACKEND_URL}/api/formations`);
      return response.json();
    });
  },

  async getCoursDisponibles(): Promise<CoursReel[]> {
    return withRetry(async () => {
      const response = await this.makeAuthenticatedRequest(`${import.meta.env.VITE_BACKEND_URL}/api/formations/courses`);
      return response.json();
    });
  },

  async assignerCours(teacherId: number, courseId: number): Promise<void> {
    return withRetry(async () => {
      await this.makeAuthenticatedRequest(`${import.meta.env.VITE_BACKEND_URL}/api/teachers/${teacherId}/courses`, {
        method: 'POST',
        body: JSON.stringify({ course_id: courseId }),
      });
    });
  },

  async retirerCours(teacherId: number, courseId: number): Promise<void> {
    return withRetry(async () => {
      await this.makeAuthenticatedRequest(`${import.meta.env.VITE_BACKEND_URL}/api/teachers/${teacherId}/courses/${courseId}`, {
        method: 'DELETE',
      });
    });
  }
};

// ==================== COMPOSANT PRINCIPAL ====================

export default function Enseignants() {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [coursDisponibles, setCoursDisponibles] = useState<CoursReel[]>([]);
  const [formationsDisponibles, setFormationsDisponibles] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [refreshActivation, setRefreshActivation] = useState(0);

  const [openDialog, setOpenDialog] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedEnseignant, setSelectedEnseignant] = useState<any>(null);

  const [formState, setFormState] = useState<Omit<Enseignant, "id">>({
    first_name: "",
    last_name: "",
    email: "",
    specialite: "",
    phone: "",
    address: "",
    postal_code: "",
    city: "",
    dateEmbauche: new Date().toISOString().split('T')[0],
    statut: 'actif',
    formations: []
  });

  const [editId, setEditId] = useState<number | null>(null);
  const [coursAssignes, setCoursAssignes] = useState<number[]>([]);

  const location = useLocation();
  useEffect(() => {
    if (location.state?.openCreate) {
      handleOpenDialog();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    loadEnseignants();
    loadFormationsDisponibles();
    loadCoursDisponibles();
  }, []);

  const loadEnseignants = async () => {
    try {
      setLoading(true);
      const data = await apiService.getEnseignants();
      setEnseignants(data);
    } catch (error) {
      showSnackbar('Erreur lors du chargement des enseignants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFormationsDisponibles = async () => {
    try {
      const data = await apiService.getFormationsDisponibles();
      setFormationsDisponibles(data);
    } catch (error) {
      showSnackbar('Erreur lors du chargement des formations', 'error');
    }
  };

  const loadCoursDisponibles = async () => {
    try {
      const data = await apiService.getCoursDisponibles();
      setCoursDisponibles(data);
    } catch (error) {
      showSnackbar('Erreur lors du chargement des cours', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getFormationsEnseignant = (enseignantId: number) => {
    const enseignant = enseignants.find(e => e.id === enseignantId);
    if (!enseignant) return [];
    return formationsDisponibles.filter(f => enseignant.formations.includes(f.id));
  };

  const getCoursEnseignant = (enseignantId: number) => {
    return coursDisponibles.filter(c => c.teacher_id === enseignantId);
  };

  const handleOpenDialog = (enseignant?: Enseignant) => {
    if (enseignant) {
      setEditId(enseignant.id);
      setFormState({
        first_name: enseignant.first_name,
        last_name: enseignant.last_name,
        email: enseignant.email,
        specialite: enseignant.specialite,
        phone: enseignant.phone,
        address: enseignant.address || "",
        postal_code: enseignant.postal_code || "",
        city: enseignant.city || "",
        dateEmbauche: enseignant.dateEmbauche,
        statut: enseignant.statut,
        formations: [...enseignant.formations]
      });

      const coursEnseignant = getCoursEnseignant(enseignant.id);
      setCoursAssignes(coursEnseignant.map(c => c.course_id));
    } else {
      setEditId(null);
      setFormState({
        first_name: "",
        last_name: "",
        email: "",
        specialite: "",
        phone: "",
        address: "",
        postal_code: "",
        city: "",
        dateEmbauche: new Date().toISOString().split('T')[0],
        statut: 'actif',
        formations: []
      });
      setCoursAssignes([]);
    }
    setOpenDialog(true);
  };

  const handleOpenDetails = async (enseignant: Enseignant) => {
    try {
      const details = await apiService.getEnseignantDetails(enseignant.id);
      setSelectedEnseignant(details);
      setOpenDetails(true);
    } catch (error) {
      showSnackbar('Erreur lors du chargement des détails', 'error');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditId(null);
    setCoursAssignes([]);
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
    setSelectedEnseignant(null);
  };

  const handleSave = async () => {
    if (!formState.first_name || !formState.last_name || !formState.email || !formState.specialite) {
      showSnackbar("Veuillez remplir tous les champs obligatoires.", "error");
      return;
    }

    try {
      setLoading(true);

      if (editId) {
        const updatedEnseignant = await apiService.updateEnseignant(editId, formState);
        setEnseignants(prev => prev.map(e => e.id === editId ? updatedEnseignant : e));
        showSnackbar("Enseignant modifié avec succès");
      } else {
        const newEnseignant = await apiService.createEnseignant(formState);
        setEnseignants(prev => [...prev, newEnseignant]);
        showSnackbar("Enseignant créé avec succès");
      }

      handleCloseDialog();
    } catch (error) {
      showSnackbar("Erreur lors de la sauvegarde", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Supprimer cet enseignant ?")) {
      try {
        setLoading(true);
        await apiService.deleteEnseignant(id);
        setEnseignants(prev => prev.filter(e => e.id !== id));
        showSnackbar("Enseignant supprimé avec succès");
      } catch (error) {
        showSnackbar("Erreur lors de la suppression", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendActivation = async (enseignantId: number) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/email/sendTeacherActivation/${enseignantId}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
      );

      // Mettre à jour le statut local de l'enseignant
      setEnseignants(prev =>
        prev.map(e =>
          e.id === enseignantId ? { ...e, statut: "inactif" } : e
        )
      );

      setRefreshActivation(prev => prev + 1);

      showSnackbar(`Email d'activation envoyé avec succès à l'enseignant `, "success");
    } catch (error: any) {
      console.error(`[Activation] Erreur lors de l'envoi de l'email :`, error.response?.data || error.message);
      showSnackbar("Erreur lors de l'envoi de l'email d'activation", "error");
    }
  };


  const toggleFormation = (formationId: number) => {
    setFormState(prev => ({
      ...prev,
      formations: prev.formations.includes(formationId)
        ? prev.formations.filter(id => id !== formationId)
        : [...prev.formations, formationId]
    }));
  };

  const handleToggleCours = async (courseId: number) => {
    if (!editId) {
      showSnackbar("Veuillez d'abord sauvegarder l'enseignant avant d'assigner des cours", "success");
      return;
    }

    try {
      if (coursAssignes.includes(courseId)) {
        await apiService.retirerCours(editId, courseId);
        setCoursAssignes(prev => prev.filter(id => id !== courseId));
        showSnackbar("Cours retiré avec succès");
      } else {
        await apiService.assignerCours(editId, courseId);
        setCoursAssignes(prev => [...prev, courseId]);
        showSnackbar("Cours assigné avec succès");
      }
      loadCoursDisponibles();
    } catch (error) {
      console.error('Erreur lors de l\'assignation du cours:', error);
      showSnackbar("Erreur lors de l'assignation du cours", "error");
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
        {/* Header section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box
            sx={{
              background: "linear-gradient(135deg, #fff 0%, #fffef8 100%)",
              borderRadius: 5,
              p: { xs: 3, md: 5 },
              mb: 5,
              boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
              border: "1px solid",
              borderColor: alpha("#D4AF37", 0.2),
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems="center"
              justifyContent="space-between"
              spacing={3}
            >
              <Box>
                <Typography
                  variant="h3"
                  fontWeight={900}
                  sx={{
                    background:
                      "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    mb: 1,
                    letterSpacing: "-0.5px",
                  }}
                >
                  Gestion des Enseignants
                </Typography>
                <Typography sx={{ color: "#666", fontWeight: 500 }}>
                  Créez, modifiez et gérez vos enseignants facilement
                </Typography>
              </Box>

              <Button
                startIcon={<AddCircleOutlineIcon />}
                variant="contained"
                onClick={() => handleOpenDialog()}
                disabled={loading}
                sx={{
                  background:
                    "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                  color: "#fff",
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 3,
                  py: 1.3,
                  boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #C5A028 0%, #B08020 100%)",
                  },
                }}
              >
                Nouvel Enseignant
              </Button>
            </Stack>
          </Box>
        </motion.div>

        {loading && enseignants.length === 0 ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress sx={{ color: "#D4AF37" }} />
          </Box>
        ) : enseignants.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Aucun enseignant disponible.
          </Alert>
        ) : (
          <Stack spacing={3}>
            {enseignants.map((enseignant, i) => {
              const formations = getFormationsEnseignant(enseignant.id);
              const cours = getCoursEnseignant(enseignant.id);

              return (
                <motion.div
                  key={enseignant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  whileHover={{ y: -6 }}
                >
                  <Card
                    sx={{
                      borderRadius: 4,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                      bgcolor: "#fff",
                      transition: "all 0.3s ease",
                      border: "1px solid",
                      borderColor: alpha("#D4AF37", 0.1),
                      position: "relative",
                      overflow: "hidden",
                      "&:hover": {
                        boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                        borderColor: "#D4AF37",
                      },
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "4px",
                        background:
                          "linear-gradient(90deg, #D4AF37 0%, #C5A028 100%)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flex: 1 }}>
                          <Box
                            sx={{
                              bgcolor: alpha("#D4AF37", 0.1),
                              borderRadius: 2,
                              p: 1.2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <PersonIcon sx={{ color: "#D4AF37" }} />
                          </Box>

                          <Box flex={1}>
                            <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                              {enseignant.first_name} {enseignant.last_name}
                            </Typography>

                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                              <Chip
                                icon={<EmailIcon />}
                                label={enseignant.email}
                                size="small"
                                sx={{
                                  bgcolor: alpha("#2196f3", 0.15),
                                  color: "#0d47a1",
                                  fontWeight: 600,
                                  borderRadius: 2,
                                  border: 'none'
                                }}
                              />
                              <Chip
                                icon={<PhoneIcon />}
                                label={enseignant.phone}
                                size="small"
                                sx={{
                                  bgcolor: alpha("#9c27b0", 0.15),
                                  color: "#6a1b9a",
                                  fontWeight: 600,
                                  borderRadius: 2,
                                  border: 'none'
                                }}
                              />
                              {enseignant.address && enseignant.city && (
                                <Chip
                                  icon={<LocationOnIcon />}
                                  label={`${enseignant.city}`}
                                  size="small"
                                  sx={{
                                    bgcolor: alpha("#f44336", 0.15),
                                    color: "#c62828",
                                    fontWeight: 600,
                                    borderRadius: 2,
                                    border: 'none'
                                  }}
                                />
                              )}
                              <Chip
                                label={enseignant.specialite}
                                size="small"
                                sx={{
                                  bgcolor: alpha("#D4AF37", 0.15),
                                  color: "#C5A028",
                                  fontWeight: 700,
                                  borderRadius: 2,
                                  border: 'none'
                                }}
                              />
                              <Chip
                                label={enseignant.statut === 'actif' ? 'Actif' : 'Inactif'}
                                size="small"
                                sx={{
                                  bgcolor: enseignant.statut === 'actif'
                                    ? alpha("#4caf50", 0.15)
                                    : alpha("#9e9e9e", 0.15),
                                  color: enseignant.statut === 'actif' ? "#2e7d32" : "#616161",
                                  fontWeight: 700,
                                  borderRadius: 2,
                                  border: 'none'
                                }}
                              />
                            </Stack>

                            <Typography variant="body2" sx={{ color: "#666", mb: 2, fontWeight: 500 }}>
                              Embauché le {new Date(enseignant.dateEmbauche).toLocaleDateString('fr-FR')}
                            </Typography>


                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: "#333" }}>
                                Formations assignées ({formations.length})
                              </Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {formations.map(formation => (
                                  <Chip
                                    key={formation.id}
                                    icon={<SchoolIcon />}
                                    label={formation.title}
                                    size="small"
                                    sx={{
                                      bgcolor: alpha("#ff9800", 0.15),
                                      color: "#e65100",
                                      fontWeight: 700,
                                      borderRadius: 2,
                                      border: 'none'
                                    }}
                                  />
                                ))}
                                {formations.length === 0 && (
                                  <Typography variant="body2" sx={{ color: "#999", fontStyle: "italic", fontWeight: 500 }}>
                                    Aucune formation assignée
                                  </Typography>
                                )}
                              </Stack>
                            </Box>

                            <Box>
                              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: "#333" }}>
                                Cours enseignés ({cours.length})
                              </Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {cours.map(coursItem => {
                                  const dureeTotale = coursItem.sessions.reduce((total, session) => {
                                    const start = new Date(session.start_time);
                                    const end = new Date(session.end_time);
                                    const duration = end.getTime() - start.getTime();
                                    return total + Math.round(duration / (1000 * 60 * 60));
                                  }, 0);

                                  return (
                                    <Chip
                                      key={coursItem.course_id}
                                      label={`${coursItem.title} (${dureeTotale}h)`}
                                      size="small"
                                      sx={{
                                        bgcolor: alpha("#4caf50", 0.15),
                                        color: "#2e7d32",
                                        fontWeight: 700,
                                        borderRadius: 2,
                                        border: 'none'
                                      }}
                                    />
                                  );
                                })}
                                {cours.length === 0 && (
                                  <Typography variant="body2" sx={{ color: "#999", fontStyle: "italic", fontWeight: 500 }}>
                                    Aucun cours assigné
                                  </Typography>
                                )}
                              </Stack>
                            </Box>

                            <Box sx={{mt: -5, display: 'flex', justifyContent: 'flex-end' }}>
                              <Button
                                variant="contained"
                                startIcon={<EmailIcon />}
                                size="small"
                                onClick={async () => {
                                  await handleSendActivation(enseignant.id);
                                  setRefreshActivation(prev => prev + 1);
                                }}
                                disabled={enseignant.statut === "actif"} // si déjà activé
                                sx={{
                                  mr:-15,
                                  borderRadius: 2,
                                  fontWeight: 700,
                                  textTransform: "none",
                                  bgcolor: alpha("#D4AF37", 0.15),
                                  color: "#C5A028",
                                  "&:hover": {
                                    bgcolor: alpha("#D4AF37", 0.25),
                                    color: "#C5A028",
                                  },
                                }}
                              >
                                Envoyer activation
                              </Button>
                            </Box>



                          </Box>
                        </Box>

                        <Stack direction="row" spacing={1}>
                          <IconButton
                            onClick={() => handleOpenDetails(enseignant)}
                            sx={{
                              color: '#2196f3',
                              '&:hover': { bgcolor: alpha("#2196f3", 0.1) }
                            }}
                            title="Détails"
                            disabled={loading}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleOpenDialog(enseignant)}
                            sx={{
                              color: '#D4AF37',
                              '&:hover': { bgcolor: alpha("#D4AF37", 0.1) }
                            }}
                            title="Modifier"
                            disabled={loading}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDelete(enseignant.id)}
                            sx={{
                              color: '#f44336',
                              '&:hover': { bgcolor: alpha("#f44336", 0.1) }
                            }}
                            title="Supprimer"
                            disabled={loading}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </Stack>
        )}

        {/* Dialogue d'édition/ajout */}
        <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
          <DialogTitle>
            {editId ? "Modifier un Enseignant" : "Créer un Enseignant"}
            <IconButton onClick={handleCloseDialog} sx={{ position: "absolute", right: 8, top: 8 }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Prénom *"
                  fullWidth
                  value={formState.first_name}
                  onChange={e => setFormState({ ...formState, first_name: e.target.value })}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nom *"
                  fullWidth
                  value={formState.last_name}
                  onChange={e => setFormState({ ...formState, last_name: e.target.value })}
                  disabled={loading}
                />
              </Grid>
            </Grid>

            <TextField
              label="Email *"
              fullWidth
              margin="normal"
              type="email"
              value={formState.email}
              onChange={e => setFormState({ ...formState, email: e.target.value })}
              disabled={loading}
            />

            <TextField
              label="Spécialité *"
              fullWidth
              margin="normal"
              value={formState.specialite}
              onChange={e => setFormState({ ...formState, specialite: e.target.value })}
              disabled={loading}
            />

            <TextField
              label="Téléphone"
              fullWidth
              margin="normal"
              value={formState.phone}
              onChange={e => setFormState({ ...formState, phone: e.target.value })}
              disabled={loading}
            />

            <TextField
              label="Adresse"
              fullWidth
              margin="normal"
              value={formState.address || ''}
              onChange={e => setFormState({ ...formState, address: e.target.value })}
              disabled={loading}
            />

            <Grid container spacing={2}>
              <Grid item xs={8}>
                <TextField
                  label="Ville"
                  fullWidth
                  margin="normal"
                  value={formState.city || ''}
                  onChange={e => setFormState({ ...formState, city: e.target.value })}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Code postal"
                  fullWidth
                  margin="normal"
                  value={formState.postal_code || ''}
                  onChange={e => setFormState({ ...formState, postal_code: e.target.value })}
                  disabled={loading}
                />
              </Grid>
            </Grid>

            <TextField
              label="Date d'embauche"
              type="date"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={formState.dateEmbauche}
              onChange={e => setFormState({ ...formState, dateEmbauche: e.target.value })}
              disabled={loading}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Statut</InputLabel>
              <Select
                value={formState.statut}
                label="Statut"
                onChange={e => setFormState({ ...formState, statut: e.target.value as 'actif' | 'inactif' })}
                disabled={loading}
              >
                <MenuItem value="actif">Actif</MenuItem>
                <MenuItem value="inactif">Inactif</MenuItem>
              </Select>
            </FormControl>

            {/* Section Formations assignées */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: "#333" }}>
                Formations assignées ({formationsDisponibles.length} disponibles)
              </Typography>
              <Grid container spacing={1}>
                {formationsDisponibles.map(formation => (
                  <Grid item xs={12} sm={6} key={formation.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        cursor: loading ? 'default' : 'pointer',
                        backgroundColor: formState.formations.includes(formation.id) ? alpha("#D4AF37", 0.1) : 'transparent',
                        borderColor: formState.formations.includes(formation.id) ? '#D4AF37' : '#e0e0e0',
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: loading ? 'transparent' : formState.formations.includes(formation.id) ? alpha("#D4AF37", 0.15) : '#f9f9f9',
                          borderColor: loading ? '#e0e0e0' : '#D4AF37'
                        }
                      }}
                      onClick={() => !loading && toggleFormation(formation.id)}
                    >
                      <Box display="flex" alignItems="center">
                        <input
                          type="checkbox"
                          checked={formState.formations.includes(formation.id)}
                          onChange={() => !loading && toggleFormation(formation.id)}
                          style={{ marginRight: 8 }}
                          disabled={loading}
                        />
                        <Typography variant="body2" fontWeight={600}>
                          {formation.title}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Section Cours assignés */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: "#333" }}>
                Cours assignés ({coursDisponibles.filter(cours =>
                  formState.formations.length === 0 ||
                  cours.formation_courses.some(fc =>
                    formState.formations.includes(fc.formations.formation_id)
                  )
                ).length} disponibles) {editId && `(ID: ${editId})`}
              </Typography>

              {!editId && (
                <Typography variant="body2" sx={{ color: "#666", mb: 2, fontWeight: 500 }}>
                  Sauvegardez d'abord l'enseignant pour assigner des cours
                </Typography>
              )}

              <Grid container spacing={1}>
                {coursDisponibles
                  .filter(cours =>
                    formState.formations.length === 0 ||
                    cours.formation_courses.some(fc =>
                      formState.formations.includes(fc.formations.formation_id)
                    )
                  )
                  .map(cours => {
                    const dureeTotale = cours.sessions.reduce((total, session) => {
                      const start = new Date(session.start_time);
                      const end = new Date(session.end_time);
                      const duration = end.getTime() - start.getTime();
                      return total + Math.round(duration / (1000 * 60 * 60));
                    }, 0);

                    const formations = cours.formation_courses.map(fc => fc.formations.title).join(', ');
                    const estAssigné = coursAssignes.includes(cours.course_id);

                    return (
                      <Grid item xs={12} sm={6} key={cours.course_id}>
                        <Card
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            cursor: editId ? 'pointer' : 'default',
                            backgroundColor: estAssigné ? alpha("#4caf50", 0.1) : 'transparent',
                            borderColor: estAssigné ? '#4caf50' : '#e0e0e0',
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: editId ? (estAssigné ? alpha("#4caf50", 0.15) : '#f9f9f9') : 'transparent',
                              borderColor: editId ? '#4caf50' : '#e0e0e0'
                            }
                          }}
                          onClick={() => editId && handleToggleCours(cours.course_id)}
                        >
                          <Box display="flex" alignItems="center">
                            <input
                              type="checkbox"
                              checked={estAssigné}
                              onChange={() => editId && handleToggleCours(cours.course_id)}
                              style={{ marginRight: 8 }}
                              disabled={!editId || loading}
                            />
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {cours.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#666", fontWeight: 500 }} display="block">
                                {formations || 'Aucune formation'} • {dureeTotale}h
                              </Typography>
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    );
                  })}
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={handleCloseDialog}
              variant="outlined"
              disabled={loading}
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
              disabled={loading}
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
              {loading ? "Chargement..." : (editId ? "Modifier l'Enseignant" : "Créer l'Enseignant")}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialogue des détails */}
        <Dialog open={openDetails} onClose={handleCloseDetails} fullWidth maxWidth="md">
          <DialogTitle>
            Détails de l'Enseignant
            <IconButton onClick={handleCloseDetails} sx={{ position: "absolute", right: 8, top: 8 }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {selectedEnseignant && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 3, color: "#333" }}>
                  {selectedEnseignant.first_name} {selectedEnseignant.last_name}
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2, color: "#D4AF37", fontWeight: 700 }}>
                      Informations Personnelles
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" sx={{ color: "#999", fontWeight: 600 }}>Email</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedEnseignant.email}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: "#999", fontWeight: 600 }}>Téléphone</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedEnseignant.phone || 'Non renseigné'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: "#999", fontWeight: 600 }}>Adresse</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedEnseignant.address ?
                            `${selectedEnseignant.address}, ${selectedEnseignant.postal_code} ${selectedEnseignant.city}` :
                            'Non renseignée'
                          }
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: "#999", fontWeight: 600 }}>Spécialité</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedEnseignant.specialite}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: "#999", fontWeight: 600 }}>Date d'embauche</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {new Date(selectedEnseignant.dateEmbauche).toLocaleDateString('fr-FR')}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: "#999", fontWeight: 600 }}>Statut</Typography>
                        <Chip
                          label={selectedEnseignant.statut === 'actif' ? 'Actif' : 'Inactif'}
                          size="small"
                          sx={{
                            bgcolor: selectedEnseignant.statut === 'actif'
                              ? alpha("#4caf50", 0.15)
                              : alpha("#9e9e9e", 0.15),
                            color: selectedEnseignant.statut === 'actif' ? "#2e7d32" : "#616161",
                            fontWeight: 700,
                            borderRadius: 2,
                            border: 'none',
                            mt: 0.5
                          }}
                        />
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2, color: "#D4AF37", fontWeight: 700 }}>
                      Formations et Cours
                    </Typography>
                    {selectedEnseignant.formations && selectedEnseignant.formations.length > 0 ? (
                      selectedEnseignant.formations.map((formation: any) => (
                        <Box key={formation.id} sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: "#333" }}>
                            {formation.nom || formation.title}
                          </Typography>
                          {formation.cours && formation.cours.length > 0 ? (
                            <Stack spacing={1}>
                              {formation.cours.map((coursItem: any) => (
                                <Box key={coursItem.id} sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  p: 1.5,
                                  bgcolor: alpha("#D4AF37", 0.05),
                                  borderRadius: 2,
                                  border: `1px solid ${alpha("#D4AF37", 0.1)}`
                                }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {coursItem.titre || coursItem.title}
                                  </Typography>
                                  <Chip
                                    label={`${coursItem.duree}h`}
                                    size="small"
                                    sx={{
                                      bgcolor: alpha("#4caf50", 0.15),
                                      color: "#2e7d32",
                                      fontWeight: 700,
                                      borderRadius: 2,
                                      border: 'none'
                                    }}
                                  />
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="body2" sx={{ color: "#999", fontStyle: "italic", fontWeight: 500 }}>
                              Aucun cours assigné pour cette formation
                            </Typography>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" sx={{ color: "#999", fontStyle: "italic", fontWeight: 500 }}>
                        Aucune formation assignée
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={handleCloseDetails}
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
              Fermer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar pour les notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}