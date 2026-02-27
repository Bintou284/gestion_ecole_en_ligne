import  { useEffect, useMemo, useState } from "react";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CircularProgress,
  Alert,
  Paper,
  Stack,
} from "@mui/material";
import { alpha } from "@mui/material";
import { motion } from "framer-motion";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import NotesIcon from "@mui/icons-material/Notes";
import PeopleIcon from "@mui/icons-material/People";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const API_BASE =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") || import.meta.env.VITE_BACKEND_URL;

// Fonction pour récupérer le token depuis localStorage
function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

export default function Apercu() {
  const navigate = useNavigate();
  // Memoisation du token et des headers pour éviter de recalculer à chaque render
  const token = useMemo(() => getToken(), []);
  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<number | null>(null);

  const [courseCount, setCourseCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [planningCount, setPlanningCount] = useState(0);
  const [notesCount] = useState(3);

  // Récupérer l'ID du professeur depuis le token
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError("Token introuvable. Merci de vous reconnecter.");
      setLoading(false);
      return;
    }

    try {
      const decoded: any = jwtDecode(token);
      setTeacherId(decoded.id);
    } catch (err) {
      console.error("Erreur de décodage du token:", err);
      setError("Impossible de décoder le token d'authentification.");
      setLoading(false);
    }
  }, []);

  // Récupération du nombre de cours
  const fetchCourseCount = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/teacher/courses`, { headers });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`GET /teacher/courses ${res.status} ${text || res.statusText}`);
      }
      const data = await res.json();
      setCourseCount(Array.isArray(data) ? data.length : 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du chargement des cours");
      setCourseCount(0);
    } finally {
      setLoading(false);
    }
  };

// Récupération des apprenants et du planning du professeur
const fetchStudentsAndSchedule = async () => {
  if (!teacherId) return;

  try {
    // Récupérer les apprenants
    const studentsRes = await fetch(`${API_BASE}/api/teachers/${teacherId}/students`, { headers });
    if (studentsRes.ok) {
      const studentsData = await studentsRes.json();
      setStudentsCount(Array.isArray(studentsData) ? studentsData.length : 0);
    } else {
      console.error("Erreur students:", await studentsRes.text());
    }

    // Récupérer les créneaux du professeur 
    const scheduleRes = await fetch(`${API_BASE}/api/schedule/teacher/${teacherId}`, { headers });
    if (scheduleRes.ok) {
      const scheduleData = await scheduleRes.json();
      
      // Filtrer pour avoir seulement les créneaux d'aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaySlots = scheduleData.filter((slot: any) => {
        const slotDate = new Date(slot.start_time);
        return slotDate >= today && slotDate < tomorrow;
      });

      setPlanningCount(todaySlots.length);
    } else {
      console.error("Erreur schedule:", await scheduleRes.text());
    }

  } catch (e) {
    console.error("Erreur lors de la récupération des stats:", e);
  }
};

  useEffect(() => {
    fetchCourseCount();
  }, []);

  useEffect(() => {
    if (teacherId) {
      fetchStudentsAndSchedule();
    }
  }, [teacherId]);

  const stats = [
    {
      label: "Mes cours",
      icon: <MenuBookIcon sx={{ fontSize: 38, my: 1, color: "#2a9d8f" }} />,
      value: courseCount,
      color: "#e0f7f5",
      onClick: () => navigate("/formateur/cours"),
    },
    {
      label: "Notes attribuées",
      icon: <NotesIcon sx={{ fontSize: 38, my: 1, color: "#25cc3d" }} />,
      value: notesCount,
      color: "#e6f8ec",
      onClick: () => navigate("/formateur/notes"),
    },
    {
      label: "Apprenants",
      icon: <PeopleIcon sx={{ fontSize: 38, my: 1, color: "#7e91f7" }} />,
      value: studentsCount,
      color: "#eef2ff",
      onClick: () => navigate("/formateur/apprenants"),
    },
    {
      label: "Planning à venir",
      icon: <CalendarMonthIcon sx={{ fontSize: 38, my: 1, color: "#f44336" }} />,
      value: planningCount,
      color: "#ffebee",
      onClick: () => navigate("/formateur/planning"),
    },
  ];

  const actions = [
    {
      label: "Attribuer des notes",
      desc: "Évaluer vos apprenants",
      color: "#25cc3d",
      onClick: () => navigate("/formateur/notes"),
    },
    {
      label: "Voir mes apprenants",
      desc: "Suivre les profils et la progression",
      color: "#7e91f7",
      onClick: () => navigate("/formateur/apprenants"),
    },
    {
      label: "Voir le planning",
      desc: "Consulter les prochaines séances",
      color: "#f44336",
      onClick: () => navigate("/formateur/planning"),
    },
  ];

  return (
    <Box sx={{ p: 3, minHeight: "100vh", width: "100%", background: "linear-gradient(135deg, #FFF9E5 0%, #FFF3D0 100%)" }}>
      <Container maxWidth="lg" sx={{ maxWidth: 1400, mx: "auto", px: 3 }}>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
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

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {loading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <CircularProgress size={20} />{" "}
            <Typography>Chargement…</Typography>
          </Box>
        )}

        <Grid container spacing={3}>
          {stats.map((item, i) => (
            <Grid item xs={12} sm={6} md={3} lg={2.4 as any} key={i}>
              <Card
                sx={{
                  borderRadius: 4,
                  bgcolor: item.color,
                  textAlign: "center",
                  p: 2,
                  boxShadow: 2,
                  transition: "0.3s",
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 6,
                  },
                }}
                onClick={item.onClick}
              >
                <Typography fontWeight={700}>{item.label}</Typography>
                {item.icon}
                <Typography variant="h4" fontWeight={900}>
                  {item.value}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ py: 5 }}>
          <Typography fontWeight={800} sx={{ mb: 2, fontSize: 18 }}>
            Actions Rapides
          </Typography>
          <Grid container spacing={2}>
            {actions.map((item, i) => (
              <Grid item xs={12} sm={6} md={3} lg={2.4 as any} key={i}>
                <Card
                  sx={{
                    bgcolor: "#fff",
                    p: 2,
                    borderRadius: 3,
                    boxShadow: 2,
                    transition: "0.3s",
                    "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                    cursor: "pointer",
                  }}
                  onClick={item.onClick}
                >
                  <Typography fontWeight={700} sx={{ color: item.color, mb: 0.5 }}>
                    {item.label}
                  </Typography>
                  <Typography color="#555">{item.desc}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}