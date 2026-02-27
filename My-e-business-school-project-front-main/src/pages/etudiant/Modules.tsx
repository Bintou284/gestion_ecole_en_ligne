import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
  alpha,
  Stack,
} from "@mui/material";
import { motion } from "framer-motion";
import SchoolIcon from "@mui/icons-material/School";
import StarRateIcon from "@mui/icons-material/StarRate";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FolderIcon from "@mui/icons-material/Folder";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

interface TeacherInfo {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

interface CourseResource {
  resource_id: number;
  title: string;
}

interface Course {
  course_id: number;
  title: string;
  description?: string | null;
  course_type?: string | null;
  credits?: number | null;
  start_date?: string | null;
  users?: TeacherInfo | null;
  course_resources?: CourseResource[];
}

interface FormationInfo {
  formation_id: number;
  title?: string | null;
  description?: string | null;
  level?: string | null;
  mode?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_BACKEND_URL;

const ModulesEtudiant: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [formation, setFormation] = useState<FormationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // useEffect pour récupérer les modules de l'étudiant
  useEffect(() => {
    const fetchStudentCourses = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Token introuvable. Merci de vous reconnecter.");
        setLoading(false);
        return;
      }

      let studentId: number | null = null;
      try {
        const decoded: any = jwtDecode(token);
        studentId = decoded.id;
      } catch (err) {
        console.error("Erreur de décodage du token :", err);
        setError("Impossible de décoder le token d'authentification.");
        setLoading(false);
        return;
      }

      if (!studentId) {
        setError("Identifiant étudiant introuvable dans le token.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/api/courses/student/${studentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "Impossible de charger les cours.");
        }

        const data = await response.json();
        setCourses(data.courses ?? []); // Stocke les cours
        setFormation(data.formation ?? null); // Stocke la formation
        setError(null);
      } catch (err: any) {
        console.error("Erreur de chargement des cours :", err);
        setCourses([]);
        setFormation(null);
        setError(err.message ?? "Erreur serveur.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentCourses();
  }, []);

  // Fonction pour naviguer vers les détails du cours
  const handleOpenCourse = (course: Course) => {
    navigate(`/etudiant/modules/${course.course_id}`);
  };

  // Fonction pour récupérer le nom complet du professeur
  const teacherName = (course: Course) => {
    if (!course.users?.first_name && !course.users?.last_name)
      return "Professeur non défini";
    return `${course.users?.first_name ?? ""} ${
      course.users?.last_name ?? ""
    }`.trim();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #FFF9E5 0%, #FFF3D0 100%)",
        py: 5,
      }}
    >
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(135deg, #fff 0%, #fffef8 100%)",
              borderRadius: 5,
              px: { xs: 3, md: 5 },
              py: { xs: 4, md: 5 },
              mb: 5,
              boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
              border: "1px solid",
              borderColor: alpha("#D4AF37", 0.2),
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                right: 0,
                width: "40%",
                height: "100%",
                background:
                  "radial-gradient(circle at top right, rgba(212, 175, 55, 0.1) 0%, transparent 70%)",
                pointerEvents: "none",
              },
            }}
          >
            <Box sx={{ zIndex: 1 }}>
              <Typography
                variant="h3"
                fontWeight={900}
                sx={{
                  background:
                    "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 1.5,
                  letterSpacing: "-0.5px",
                }}
              >
                Mes Modules
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "#666", fontWeight: 500, mb: 1 }}
              >
                {formation
                  ? `${formation.title ?? "Formation"
                    }`
                  : "Suis ta progression et décroche tes badges !"}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <Chip
                  label={`${courses.length} ${
                    courses.length > 1 ? "Cours" : "Cours"
                  }`}
                  sx={{
                    bgcolor: alpha("#D4AF37", 0.15),
                    color: "#C5A028",
                    fontWeight: 700,
                    borderRadius: 2,
                  }}
                />
                {formation?.level && (
                  <Chip
                    label={formation.level}
                    sx={{
                      bgcolor: alpha("#4caf50", 0.15),
                      color: "#2e7d32",
                      fontWeight: 700,
                      borderRadius: 2,
                    }}
                  />
                )}
              </Box>
            </Box>
            <Box
              
            >
              <StarRateIcon sx={{ color: "#fff", fontSize: 50 }} />
            </Box>
          </Box>
        </motion.div>

        {loading ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={10}
          >
            <CircularProgress
              size={50}
              thickness={4}
              sx={{ color: "#D4AF37", mb: 2 }}
            />
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              Chargement de tes modules...
            </Typography>
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            sx={{
              borderRadius: 3,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            {error}
          </Alert>
        ) : courses.length === 0 ? (
          <Alert
            severity="info"
            sx={{
              borderRadius: 3,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            Aucun cours associé à ta formation pour le moment.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {courses.map((course, idx) => (
              <Grid item xs={12} md={6} key={course.course_id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <Card
                    onClick={() => handleOpenCourse(course)}
                    sx={{
                      borderRadius: 4,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                      bgcolor: "#fff",
                      minHeight: 280,
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor: alpha("#D4AF37", 0.1),
                      position: "relative",
                      overflow: "hidden",
                      "&:hover": {
                        boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                        borderColor: "#D4AF37",
                        "& .arrow-icon": {
                          transform: "translateX(4px)",
                        },
                        "& .course-badge": {
                          transform: "scale(1.05)",
                        },
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
                      {/* Header */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          mb: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
                          <Box
                            className="course-badge"
                            sx={{
                              bgcolor: alpha("#D4AF37", 0.1),
                              borderRadius: 2,
                              p: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "transform 0.3s ease",
                            }}
                          >
                            <SchoolIcon sx={{ color: "#D4AF37", fontSize: 28 }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="h6"
                              fontWeight={800}
                              sx={{
                                color: "#333",
                                mb: 0.5,
                                lineHeight: 1.3,
                              }}
                            >
                              {course.title}
                            </Typography>
                           
                          </Box>
                        </Box>
                      </Box>

                      {/* Description */}
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 2.5,
                          color: "#666",
                          lineHeight: 1.6,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {course.description ||
                          "Aucune description fournie pour ce module."}
                      </Typography>

                      {/* Infos */}
                      <Stack spacing={1} sx={{ mb: 2.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <PersonIcon
                            sx={{ fontSize: 18, color: "#999" }}
                          />
                          <Typography variant="body2" sx={{ color: "#666" }}>
                            <strong>{teacherName(course)}</strong>
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 2 }}>
                          {course.start_date && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <CalendarTodayIcon
                                sx={{ fontSize: 16, color: "#999" }}
                              />
                              <Typography
                                variant="caption"
                                sx={{ color: "#666" }}
                              >
                                {new Date(
                                  course.start_date
                                ).toLocaleDateString("fr-FR")}
                              </Typography>
                            </Box>
                          )}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <FolderIcon
                              sx={{ fontSize: 16, color: "#999" }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ color: "#666" }}
                            >
                              {course.course_resources?.length ?? 0}{" "}
                              ressources
                            </Typography>
                          </Box>
                          {course.credits && (
                            <Chip
                              label={`${course.credits} crédits`}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                bgcolor: alpha("#4caf50", 0.1),
                                color: "#2e7d32",
                              }}
                            />
                          )}
                        </Box>
                      </Stack>

                      {/* Button */}
                      <Button
                        fullWidth
                        variant="contained"
                        endIcon={
                          <ArrowForwardIcon
                            className="arrow-icon"
                            sx={{ transition: "transform 0.3s ease" }}
                          />
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenCourse(course);
                        }}
                        sx={{
                          background:
                            "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                          color: "#fff",
                          borderRadius: 2.5,
                          textTransform: "none",
                          fontWeight: 700,
                          py: 1.2,
                          boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
                          "&:hover": {
                            background:
                              "linear-gradient(135deg, #C5A028 0%, #B08020 100%)",
                            boxShadow: "0 6px 16px rgba(212, 175, 55, 0.4)",
                          },
                        }}
                      >
                        Voir les détails
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default ModulesEtudiant;