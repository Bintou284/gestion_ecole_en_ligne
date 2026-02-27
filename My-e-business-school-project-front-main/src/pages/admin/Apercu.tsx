import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CircularProgress,
  Alert,
  CardContent,

} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import { alpha } from "@mui/material";
import { motion } from "framer-motion";
import { Paper, Stack } from "@mui/material";

// --- API config
const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api`;

// Récupère un éventuel token depuis plusieurs emplacements possibles (localStorage ou cookies).
function getTokenFromAnywhere() {
  const keys = ["token", "authToken", "accessToken", "jwt", "bearer"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  const m = document.cookie.match(/(?:^|;\\s*)token=([^;]+)/);
  if (m?.[1]) return decodeURIComponent(m[1]);
  return null;
}

// Affiche une carte de statistique avec icône, valeur et animation.
const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  onClick?: () => void;
}> = ({ title, value, subtitle, icon, color = "#D4AF37", onClick }) => (
  <motion.div
    whileHover={{ y: -4 }}
    transition={{ duration: 0.3 }}
  >
    <Card
      onClick={onClick}
      sx={{
        height: "100%",
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha(color, 0.2),
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
        cursor: onClick ? "pointer" : "default",
        "&:hover": {
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          borderColor: color,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography
            variant="caption"
            sx={{ color: "#666", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}
          >
            {title}
          </Typography>
          {icon && (
            <Box
              sx={{
                bgcolor: alpha(color, 0.1),
                borderRadius: 2,
                p: 1,
                display: "flex",
                alignItems: "center",
                color: color,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
        <Typography variant="h3" sx={{ color: "#333", fontWeight: 900, mb: 1 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: "#666" }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

// Affiche une carte d’action cliquable pour accéder rapidement à une fonctionnalité.
const ActionCard: React.FC<{
  label: string;
  description: string;
  color: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}> = ({ label, description, color, icon, onClick }) => (
  <motion.div
    whileHover={{ y: -4 }}
    transition={{ duration: 0.3 }}
  >
    <Card
      onClick={onClick}
      sx={{
        height: "100%",
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha(color, 0.2),
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
        cursor: "pointer",
        "&:hover": {
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          borderColor: color,
          "& .action-icon": {
            transform: "scale(1.1) rotate(90deg)",
          },
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          {icon && (
            <Box
              className="action-icon"
              sx={{
                bgcolor: alpha(color, 0.1),
                borderRadius: 2,
                p: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.3s ease",
              }}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" fontWeight={700} sx={{ color: color, mb: 0.5 }}>
              {label}
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              {description}
            </Typography>
          </Box>
          <ArrowForwardIcon sx={{ color: alpha(color, 0.5), fontSize: 20 }} />
        </Box>
      </CardContent>
    </Card>
  </motion.div>
);

export default function Apercu() {
  const token = useMemo(() => getTokenFromAnywhere() ?? "", []);
  const navigate = useNavigate();

  const [programmeCount, setProgrammeCount] = useState(0);

  const [coursesCount, setCoursesCount] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

// Charge toutes les statistiques (formations, modules, enseignants, étudiants) depuis l’API.
const fetchAllStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // 1. Formations
      const formationsRes = await fetch(`${API_BASE}/formations`, { headers });
      if (formationsRes.ok) {
        const formationsData = await formationsRes.json();
        setProgrammeCount(formationsData.length);
      }
      
      // 2. Cours (Modules)
      const coursesRes = await fetch(`${API_BASE}/courses`, { headers });
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCoursesCount(coursesData.length);
      }

      // 3. Enseignants
      const teachersRes = await fetch(`${API_BASE}/teachers`, { headers });
      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachersCount(teachersData.length);
      } else {
        console.error("Erreur teachers:", await teachersRes.text());
      }

      // 4. Étudiants
      const studentsRes = await fetch(`${API_BASE}/studentProfiles`, { headers });
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudentsCount(studentsData.length);
      } else {
        console.error("Erreur students:", await studentsRes.text());
      }

    } catch (e) {
      console.error('Erreur:', e);
      setError(e instanceof Error ? e.message : "Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStats();
  }, []);

  // Statistiques 
  const stats = [
    {
      label: "Formations",
      icon: <SchoolIcon sx={{ fontSize: 24 }} />,
      value: programmeCount,
      color: "#D4AF37",
      subtitle: "Formations actives",
      onClick: () => navigate("/admin/programmes"),
    },
    {
      label: "Modules",
      icon: <MenuBookIcon sx={{ fontSize: 24 }} />,
      value: coursesCount,
      color: "#2a9d8f",
      subtitle: "Cours disponibles",
      onClick: () => navigate("/admin/modules"),
    },
    {
      label: "Enseignants",
      icon: <PersonIcon sx={{ fontSize: 24 }} />,
      value: teachersCount,
      color: "#9c27b0",
      subtitle: "Formateurs actifs",
      onClick: () => navigate("/admin/enseignants"),
    },
    {
      label: "Étudiants",
      icon: <GroupIcon sx={{ fontSize: 24 }} />,
      value:  studentsCount,
      color: "#1976d2",
      subtitle: "Profils inscrits",
      onClick: () => navigate("/admin/profils-etudiants"),
    },
 
  ];

  // === Actions rapides ===
  const actions = [
    {
      label: "Nouvelle Formation",
      desc: "Créer une formation",
      color: "#D4AF37",
      icon: <AddIcon sx={{ color: "#D4AF37", fontSize: 28 }} />,
      onClick: () => navigate("/admin/programmes", { state: { openCreate: true } }),
    },
    {
      label: "Nouveau Module",
      desc: "Ajouter un cours",
      color: "#2a9d8f",
      icon: <AddIcon sx={{ color: "#2a9d8f", fontSize: 28 }} />,
      onClick: () => navigate("/admin/modules", { state: { openCreate: true } }),
    },
    {
      label: "Nouvel Enseignant",
      desc: "Ajouter un formateur",
      color: "#9c27b0",
      icon: <AddIcon sx={{ color: "#9c27b0", fontSize: 28 }} />,
      onClick: () => navigate("/admin/enseignants", { state: { openCreate: true } }),
    },
    {
      label: "Nouveau Profil",
      desc: "Créer un étudiant",
      color: "#1976d2",
      icon: <AddIcon sx={{ color: "#1976d2", fontSize: 28 }} />,
      onClick: () => navigate("/admin/profils-etudiants", { state: { openCreate: true } }),
    },
    {
      label: "Nouvel Créneau",
      desc: "Ajouter au planning",
      color: "#f44336",
      icon: <AddIcon sx={{ color: "#f44336", fontSize: 28 }} />,
      onClick: () => navigate("/admin/planning", { state: { openCreate: true } }),
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #FFF9E5 0%, #FFF3D0 100%)",
        py: 5,
      }}
    >
      <Box sx={{ maxWidth: 1400, mx: "auto", px: 3 }}>
        {/* Header Admin */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={0}
            sx={{
              mb: 4,
              p: 4,
              borderRadius: 4,
              background: "linear-gradient(135deg, #fff 0%, #fffef8 100%)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              border: "1px solid",
              borderColor: alpha("#D4AF37", 0.2),
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${alpha("#D4AF37", 0.1)} 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="center">
              <Box sx={{ flex: 1 }}>
                <Typography variant="h2" fontWeight={900} sx={{
                  background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 1,
                  letterSpacing: "-0.5px",
                }}>
                Bonjour
                </Typography>
                <Typography variant="body1" sx={{ color: "#666", mb: 1.5, fontSize: "1.3rem" }}>
                Bienvenue à La Ruche Académie !
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </motion.div>


        {/* Messages d'erreur ou chargement */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 10,
            }}
          >
            <CircularProgress size={50} thickness={4} sx={{ color: "#D4AF37", mb: 2 }} />
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              Chargement des statistiques...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Statistiques */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Grid container spacing={3} mb={4}>
                {stats.map((item, i) => (
                  <Grid item xs={12} sm={6} md={4} lg={2.4} key={i}>
                    <StatCard
                      title={item.label}
                      value={item.value}
                      subtitle={item.subtitle}
                      icon={item.icon}
                      color={item.color}
                      onClick={item.onClick}
                    />
                  </Grid>
                ))}
              </Grid>
            </motion.div>

            {/* Actions rapides */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: alpha("#D4AF37", 0.15),
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  background: "linear-gradient(135deg, #fff 0%, #fffef8 100%)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                  <Box
                    sx={{
                      bgcolor: alpha("#D4AF37", 0.1),
                      borderRadius: 2,
                      p: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <AddIcon sx={{ color: "#D4AF37" }} />
                  </Box>
                  <Typography variant="h5" fontWeight={800}>
                    Actions rapides
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  {actions.map((item, i) => (
                    <Grid item xs={12} sm={6} md={4} lg={2.4} key={i}>
                      <ActionCard
                        label={item.label}
                        description={item.desc}
                        color={item.color}
                        icon={item.icon}
                        onClick={item.onClick}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </motion.div>

           
          </>
        )}
      </Box>
    </Box>
  );
}