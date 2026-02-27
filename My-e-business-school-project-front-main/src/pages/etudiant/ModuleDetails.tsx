import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  Container,
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Stack,
  Card,
  CardContent,
  Grid,
  alpha,
} from "@mui/material";
import { motion } from "framer-motion";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SchoolIcon from "@mui/icons-material/School";
import FolderIcon from "@mui/icons-material/Folder";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

interface TeacherInfo {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

interface CourseResource {
  resource_id: number;
  title: string;
  description?: string | null;
  file_path?: string | null;
  external_url?: string | null;
  mime_type?: string | null;
}

interface CourseDetail {
  course_id: number;
  title: string;
  description?: string | null;
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

const ModuleDetailsEtudiant: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [formation, setFormation] = useState<FormationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setError("Identifiant du cours manquant.");
        setLoading(false);
        return;
      }

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
          `${API_BASE_URL}/api/courses/student/${studentId}/course/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "Impossible de charger ce cours.");
        }

        const data = await response.json();
        setCourse(data.course);
        setFormation(data.formation ?? null);
        setError(null);
      } catch (err: any) {
        console.error("Erreur de chargement du cours :", err);
        setCourse(null);
        setFormation(null);
        setError(err.message ?? "Erreur serveur.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  // Fonction pour récupérer le nom complet du professeur
  const teacherName = () => {
    if (!course?.users?.first_name && !course?.users?.last_name)
      return "Professeur non défini";
    return `${course?.users?.first_name ?? ""} ${
      course?.users?.last_name ?? ""
    }`.trim();
  };

  // Fonction pour récupérer l'URL d'une ressource
  const resourceUrl = (resource: CourseResource) => {
    if (resource.external_url) return resource.external_url;
    if (resource.file_path) {
      return resource.file_path.startsWith("http")
        ? resource.file_path
        : `${API_BASE_URL}${resource.file_path}`;
    }
    return "#";
  };

  // Fonction pour choisir l'icône selon le type de ressource
  const getResourceIcon = (mimeType?: string | null) => {
    if (!mimeType) return <DescriptionIcon sx={{ fontSize: 28 }} />;
    if (mimeType.includes("pdf"))
      return <PictureAsPdfIcon sx={{ fontSize: 28, color: "#d32f2f" }} />;
    return <DescriptionIcon sx={{ fontSize: 28, color: "#D4AF37" }} />;
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
        {/* Bouton retour */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              mb: 3,
              textTransform: "none",
              fontWeight: 700,
              color: "#D4AF37",
              "&:hover": {
                bgcolor: alpha("#D4AF37", 0.1),
              },
            }}
          >
            Retour aux modules
          </Button>
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
              Chargement du module...
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
        ) : !course ? (
          <Alert
            severity="info"
            sx={{
              borderRadius: 3,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            Cours introuvable.
          </Alert>
        ) : (
          <>
            {/* Header du cours */}
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
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: alpha("#D4AF37", 0.1),
                      borderRadius: 3,
                      p: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SchoolIcon sx={{ color: "#D4AF37", fontSize: 40 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="h3"
                        fontWeight={900}
                        sx={{ color: "#333", letterSpacing: "-0.5px" }}
                      >
                        {course.title}
                      </Typography>
                     
                    </Box>
                    <Typography
                      variant="body1"
                      sx={{ color: "#666", lineHeight: 1.7, mb: 2 }}
                    >
                      {course.description ||
                        "Aucune description fournie pour ce module."}
                    </Typography>

                    {/* Infos du cours */}
                    <Stack direction="row" spacing={3} flexWrap="wrap">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 20, color: "#999" }} />
                        <Typography variant="body2" sx={{ color: "#666" }}>
                          <strong>{teacherName()}</strong>
                        </Typography>
                      </Box>
                      {course.start_date && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CalendarTodayIcon sx={{ fontSize: 18, color: "#999" }} />
                          <Typography variant="body2" sx={{ color: "#666" }}>
                            {new Date(course.start_date).toLocaleDateString("fr-FR")}
                          </Typography>
                        </Box>
                      )}
                      {course.credits && (
                        <Chip
                          label={`${course.credits} crédits`}
                          size="small"
                          sx={{
                            bgcolor: alpha("#4caf50", 0.15),
                            color: "#2e7d32",
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </Stack>
                  </Box>
                </Box>

                {formation && (
                  <Box
                    sx={{
                      bgcolor: alpha("#2196f3", 0.05),
                      borderRadius: 2,
                      p: 2,
                      border: "1px solid",
                      borderColor: alpha("#2196f3", 0.1),
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "#666" }}>
                      <strong>Formation :</strong> {formation.title ?? "Sans titre"}{" "}
                      {formation.level && `• ${formation.level}`}{" "}
                      {formation.mode && `• ${formation.mode}`}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </motion.div>

            {/* Ressources du cours */}
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
                  background: "linear-gradient(135deg, #fff 0%, #fffef8 100%)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                  border: "1px solid",
                  borderColor: alpha("#D4AF37", 0.2),
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
                    <FolderIcon sx={{ color: "#D4AF37" }} />
                  </Box>
                  <Typography variant="h5" fontWeight={800}>
                    Ressources du cours
                  </Typography>
                  <Chip
                    label={`${course.course_resources?.length ?? 0} ressource${
                      (course.course_resources?.length ?? 0) > 1 ? "s" : ""
                    }`}
                    size="small"
                    sx={{
                      bgcolor: alpha("#D4AF37", 0.15),
                      color: "#C5A028",
                      fontWeight: 700,
                    }}
                  />
                </Box>

                {course.course_resources && course.course_resources.length > 0 ? (
                  <Grid container spacing={2}>
                    {course.course_resources.map((resource, idx) => (
                      <Grid item xs={12} md={6} key={resource.resource_id}>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          whileHover={{ y: -4 }}
                        >
                          <Card
                            component="a"
                            href={resourceUrl(resource)}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              borderRadius: 3,
                              border: "1px solid",
                              borderColor: alpha("#D4AF37", 0.1),
                              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                              transition: "all 0.3s ease",
                              cursor: "pointer",
                              textDecoration: "none",
                              "&:hover": {
                                boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                                borderColor: "#D4AF37",
                                "& .resource-icon": {
                                  transform: "scale(1.1)",
                                },
                              },
                            }}
                          >
                            <CardContent sx={{ p: 2.5 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: 2,
                                }}
                              >
                                <Box
                                  className="resource-icon"
                                  sx={{
                                    bgcolor: alpha("#D4AF37", 0.1),
                                    borderRadius: 2,
                                    p: 1.5,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "transform 0.3s ease",
                                  }}
                                >
                                  {getResourceIcon(resource.mime_type)}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <Typography
                                    variant="body1"
                                    fontWeight={700}
                                    sx={{ color: "#333", mb: 0.5 }}
                                  >
                                    {resource.title || "Ressource"}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "#666",
                                      display: "block",
                                      mb: 1,
                                    }}
                                  >
                                    {resource.description ||
                                      resource.mime_type ||
                                      "Cliquer pour ouvrir"}
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                    }}
                                  >
                                    {resource.external_url ? (
                                      <Chip
                                        icon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                                        label="Lien externe"
                                        size="small"
                                        sx={{
                                          height: 22,
                                          fontSize: "0.7rem",
                                          bgcolor: alpha("#2196f3", 0.1),
                                          color: "#1976d2",
                                          fontWeight: 600,
                                        }}
                                      />
                                    ) : (
                                      <Chip
                                        icon={<DownloadIcon sx={{ fontSize: 14 }} />}
                                        label="Télécharger"
                                        size="small"
                                        sx={{
                                          height: 22,
                                          fontSize: "0.7rem",
                                          bgcolor: alpha("#4caf50", 0.1),
                                          color: "#2e7d32",
                                          fontWeight: 600,
                                        }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert
                    severity="info"
                    sx={{
                      borderRadius: 3,
                      bgcolor: alpha("#2196f3", 0.05),
                      border: "1px solid",
                      borderColor: alpha("#2196f3", 0.1),
                    }}
                  >
                    Aucune ressource n'est disponible pour le moment.
                  </Alert>
                )}
              </Paper>
            </motion.div>
          </>
        )}
      </Container>
    </Box>
  );
};

export default ModuleDetailsEtudiant;