import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Stack,
  Card,
  CardContent,
  Avatar,
  Chip,
  alpha,
  CircularProgress,
  Alert,
} from "@mui/material";
import { motion } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SchoolIcon from "@mui/icons-material/School";
import GradeIcon from "@mui/icons-material/Grade";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RoomIcon from "@mui/icons-material/Room";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_BACKEND_URL;

interface Student {
  first_name: string;
  email: string;
}

interface Course {
  course_id: number;
  title: string;
  course_type: string;
  credits: number;
}

interface ScheduleSlot {
  slot_id: number;
  start_time: string;
  end_time: string;
  room: string;
  courses: {
    title: string;
    course_type: string;
  };
  users_schedule_slots_teacher_idTousers: {
    first_name: string;
  };
}

interface Grade {
  grade_id: number;
  score: number;
  item_name: string;
  item_type: string;
  graded_at: string;
  courses: {
    title: string;
  };
}

interface Formation {
  title: string;
  level: string;
  mode: string;
}

// Composant réutilisable pour afficher une carte KPI avec titre, valeur, icône et couleur
const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
}> = ({ title, value, subtitle, icon, color = "#D4AF37" }) => (
  <motion.div
    whileHover={{ y: -4 }}
    transition={{ duration: 0.3 }}
  >
    <Card
      sx={{
        height: "100%",
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha(color, 0.2),
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          borderColor: color,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="caption" sx={{ color: "#666", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>
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
        {subtitle && <Box>{subtitle}</Box>}
      </CardContent>
    </Card>
  </motion.div>
);

export default function AccueilEtudiant() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [formation, setFormation] = useState<Formation | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState<ScheduleSlot[]>([]);
  const [recentGrades, setRecentGrades] = useState<Grade[]>([]);
  const [studentId, setStudentId] = useState<number | null>(null);

  // Décodage du token JWT et récupération de l'id de l'étudiant
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Token introuvable. Merci de vous reconnecter.");
      setLoading(false);
      return;
    }

    try {
      const decoded: any = jwtDecode(token);
      setStudentId(decoded.id);
    } catch (err) {
      console.error("Erreur de décodage du token :", err);
      setError("Impossible de décoder le token d'authentification.");
      setLoading(false);
    }
  }, []);

  // Chargement des données du dashboard de l'étudiant
  useEffect(() => {
    if (!studentId) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        // Récupérer les infos de l'étudiant
        const studentResponse = await fetch(`${API_BASE_URL}/api/users/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (studentResponse.ok) {
          const studentData = await studentResponse.json();
          setStudent(studentData);
        } else {
          console.error("Erreur student:", await studentResponse.text());
        }

        // Récupérer les cours
        const coursesResponse = await fetch(`${API_BASE_URL}/api/courses/student/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setCourses(coursesData.courses || []);
          setFormation(coursesData.formation || null);
        } else {
          console.error("Erreur courses:", await coursesResponse.text());
        }

        // Récupérer le planning (prochains cours)
        const scheduleResponse = await fetch(`${API_BASE_URL}/api/schedule/student/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json();
          const now = new Date();
          const upcoming = scheduleData
            .filter((slot: ScheduleSlot) => new Date(slot.start_time) > now)
            .sort((a: ScheduleSlot, b: ScheduleSlot) =>
              new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
            )
            .slice(0, 3);
          setUpcomingSchedule(upcoming);
        } else {
          console.error("Erreur schedule:", await scheduleResponse.text());
        }

        setError(null);
      } catch (err: any) {
        console.error("Erreur:", err);
        setError(err.message || "Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [studentId]);

  const totalCredits = courses.reduce((sum, course) => sum + (course.credits || 0), 0);
  const averageGrade = recentGrades.length > 0
    ? (recentGrades.reduce((sum, g) => sum + Number(g.score), 0) / recentGrades.length).toFixed(1)
    : null;

  const getGradeColor = (score: number) => {
    if (score >= 15) return "#46b96e";
    if (score >= 10) return "#FDBA48";
    return "#ff4d4f";
  };

  const capitalize = (str: string | undefined) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #FFF9E5 0%, #FFF3D0 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={50} thickness={4} sx={{ color: "#D4AF37", mb: 2 }} />
          <Typography variant="body1" color="text.secondary" fontWeight={500}>
            Chargement de ton tableau de bord...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #FFF9E5 0%, #FFF3D0 100%)",
          py: 5,
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: "auto", px: 3 }}>
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {error}
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #FFF9E5 0%, #FFF3D0 100%)",
        py: 5,
      }}
    >
      <Box sx={{ maxWidth: 1400, mx: "auto", px: 3 }}>
        {/* Header */}
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
                display: { xs: "none", sm: "block" },
              }}
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="center">
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "transparent",
                  background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                  fontSize: "2rem",
                  fontWeight: 900,
                  color: "#fff",
                }}
              >
                {student?.first_name?.[0]?.toUpperCase() ?? "A"}
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography variant="h2" fontWeight={900} sx={{ color: "#333", mb: 0.5, letterSpacing: "-1px" }}>
                  Bonjour {capitalize(student?.first_name)}
                </Typography>
                <Typography variant="body1" sx={{ color: "#666", mb: 1.5, fontSize: "1.3rem" }}>
                  Bienvenue à La Ruche Académie !
                </Typography>
              </Box>

              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate("/etudiant/modules")}
                sx={{
                  background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2.5,
                  boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #C5A028 0%, #B08020 100%)",
                    boxShadow: "0 6px 16px rgba(212, 175, 55, 0.4)",
                  },
                }}
              >
                Mes cours
              </Button>
            </Stack>
          </Paper>
        </motion.div>

        {/* KPIs */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Cours inscrits"
              value={courses.length}
              icon={<SchoolIcon />}
              color="#D4AF37"
              subtitle={
                <Typography variant="caption" sx={{ color: "#666" }}>
                  {totalCredits} crédits au total
                </Typography>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Moyenne générale"
              value={averageGrade ? `${averageGrade}/20` : "N/A"}
              icon={<GradeIcon />}
              color={averageGrade ? getGradeColor(Number(averageGrade)) : "#999"}
              subtitle={
                <Typography variant="caption" sx={{ color: "#666" }}>
                  {recentGrades.length} note{recentGrades.length > 1 ? "s" : ""} enregistrée{recentGrades.length > 1 ? "s" : ""}
                </Typography>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Prochains cours"
              value={upcomingSchedule.length}
              icon={<CalendarTodayIcon />}
              color="#2196f3"
              subtitle={
                <Typography variant="caption" sx={{ color: "#666" }}>
                  À venir cette semaine
                </Typography>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Prochains cours */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  border: "1px solid",
                  borderColor: alpha("#D4AF37", 0.15),
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box
                        sx={{
                          bgcolor: alpha("#2196f3", 0.1),
                          borderRadius: 2,
                          p: 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <CalendarTodayIcon sx={{ color: "#2196f3" }} />
                      </Box>
                      <Typography variant="h6" fontWeight={800}>
                        Prochains cours
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => navigate("/etudiant/calendrier")}
                      sx={{
                        color: "#D4AF37",
                        fontWeight: 600,
                        "&:hover": { bgcolor: alpha("#D4AF37", 0.1) },
                      }}
                    >
                      Voir tout
                    </Button>
                  </Stack>

                  {upcomingSchedule.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Aucun cours prévu prochainement
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {upcomingSchedule.map((slot) => (
                        <Box
                          key={slot.slot_id}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha("#2196f3", 0.05),
                            border: "1px solid",
                            borderColor: alpha("#2196f3", 0.1),
                          }}
                        >
                          <Typography variant="body1" fontWeight={700} sx={{ mb: 0.5 }}>
                            {slot.courses?.title || "Cours"}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <AccessTimeIcon sx={{ fontSize: 16, color: "#666" }} />
                              <Typography variant="caption" sx={{ color: "#666" }}>
                                {new Date(slot.start_time).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                })}
                                {" • "}
                                {new Date(slot.start_time).toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Typography>
                            </Box>
                            {slot.room && (
                              <Chip
                                icon={<RoomIcon sx={{ fontSize: 14 }} />}
                                label={slot.room}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.7rem",
                                  bgcolor: alpha("#f44336", 0.15),
                                  color: "#d32f2f",
                                  fontWeight: 700,
                                  "& .MuiChip-icon": {
                                    color: "#d32f2f",
                                  },
                                }}
                              />
                            )}
                            <Chip
                              label={slot.courses?.course_type || "Cours"}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.7rem",
                                bgcolor: alpha("#D4AF37", 0.15),
                                color: "#C5A028",
                                fontWeight: 700,
                              }}
                            />
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Notes récentes */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  border: "1px solid",
                  borderColor: alpha("#D4AF37", 0.15),
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box
                        sx={{
                          bgcolor: alpha("#46b96e", 0.1),
                          borderRadius: 2,
                          p: 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <GradeIcon sx={{ color: "#46b96e" }} />
                      </Box>
                      <Typography variant="h6" fontWeight={800}>
                        Notes récentes
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => navigate("/etudiant/notes")}
                      sx={{
                        color: "#D4AF37",
                        fontWeight: 600,
                        "&:hover": { bgcolor: alpha("#D4AF37", 0.1) },
                      }}
                    >
                      Voir tout
                    </Button>
                  </Stack>

                  {recentGrades.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Aucune note enregistrée pour le moment
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {recentGrades.map((grade) => (
                        <Box
                          key={grade.grade_id}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha(getGradeColor(Number(grade.score)), 0.05),
                            border: "1px solid",
                            borderColor: alpha(getGradeColor(Number(grade.score)), 0.1),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                              {grade.item_name || "Évaluation"}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#666" }}>
                              {grade.courses?.title} • {grade.item_type}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${grade.score}/20`}
                            sx={{
                              bgcolor: alpha(getGradeColor(Number(grade.score)), 0.15),
                              color: getGradeColor(Number(grade.score)),
                              fontWeight: 800,
                              fontSize: "0.9rem",
                            }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}