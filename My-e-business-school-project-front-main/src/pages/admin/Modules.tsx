import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Card,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Select,
  MenuItem,
  IconButton,
  Box,
  Grid,
  Stack,
  Alert,
  Chip,
  alpha,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

const courseTypes = ["CM", "TD", "TP", "En ligne"];

export default function Modules() {
  const [modules, setModules] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    teacher_id: "",
    course_type: "",
    credits_min: "",
    credits_max: "",
  });

  const [openDialog, setOpenDialog] = useState(false);
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    teacher_id: "",
    start_date: "",
    credits: "",
    course_type: "",
    formation_id: "",
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();

  // Charge automatiquement le popup de création si la page est ouverte avec un state spécifique.
  useEffect(() => {
    if (location.state?.openCreate) {
      handleOpenDialog();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Charge la liste des enseignants depuis l’API au montage du composant.
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/teachers/teachers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Impossible de charger les enseignants");
        const data = await res.json();
        setTeachers(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      }
    };
    fetchTeachers();
  }, []);

  // Charge la liste des formations depuis l’API au montage du composant.
  useEffect(() => {
    const fetchFormations = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/formations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Impossible de charger les formations");
        const data = await res.json();
        setFormations(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      }
    };
    fetchFormations();
  }, []);

  // Charge tous les modules en tenant compte des filtres appliqués.
  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value as string);
      });
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/courses?${queryParams.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Erreur lors du chargement des modules");
      const data = await res.json();
      setModules(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Met à jour la valeur d’un filtre individuel.
  const handleFilterChange = (field: string, value: string) =>
    setFilters((prev) => ({ ...prev, [field]: value }));

  // Recharge les modules après avoir appliqué les filtres.
  const handleApplyFilters = () => fetchCourses();

  // Réinitialise tous les filtres et recharge les modules.
  const handleResetFilters = () => {
    setFilters({ teacher_id: "", course_type: "", credits_min: "", credits_max: "" });
    fetchCourses();
  };

  // Ouvre la fenêtre de création ou d’édition en remplissant le formulaire si nécessaire.
  const handleOpenDialog = (module?: any) => {
    if (module) {
      setEditId(module.course_id);
      setFormState({
        title: module.title || "",
        description: module.description || "",
        teacher_id: module.teacher_id?.toString?.() || "",
        start_date: module.start_date ? module.start_date.split("T")[0] : "",
        credits: module.credits?.toString?.() || "",
        course_type: module.course_type || "",
        formation_id:
          module.formation_courses?.[0]?.formation_id?.toString?.() || "",
      });
    } else {
      setEditId(null);
      setFormState({
        title: "",
        description: "",
        teacher_id: "",
        start_date: "",
        credits: "",
        course_type: "",
        formation_id: "",
      });
    }
    setOpenDialog(true);
  };

  // Ferme la fenêtre de création/édition et réinitialise le formulaire.
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditId(null);
    setFormState({
      title: "",
      description: "",
      teacher_id: "",
      start_date: "",
      credits: "",
      course_type: "",
      formation_id: "",
    });
  };

  // Sauvegarde un module (création ou modification) via une requête API.
  const handleSave = async () => {
    if (
      !formState.title ||
      !formState.description ||
      !formState.teacher_id ||
      !formState.formation_id
    ) {
      alert("Merci de remplir les champs obligatoires.");
      return;
    }

    const token = localStorage.getItem("token");
    const isEdit = Boolean(editId);
    const method = isEdit ? "PATCH" : "POST";
    const url = isEdit
      ? `${import.meta.env.VITE_BACKEND_URL}/api/courses/${editId}`
      : `${import.meta.env.VITE_BACKEND_URL}/api/courses`;

    try {
      const body = {
        title: formState.title,
        description: formState.description,
        teacher_id: Number(formState.teacher_id),
        start_date: formState.start_date
          ? new Date(formState.start_date).toISOString()
          : null,
        credits: formState.credits ? Number(formState.credits) : null,
        course_type: formState.course_type || null,
        formation_id: Number(formState.formation_id),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      if (isEdit) {
        setModules((prev) =>
          prev.map((m) => (m.course_id === data.course.course_id ? data.course : m))
        );
      } else {
        setModules((prev) => [data.course, ...prev]);
      }

      handleCloseDialog();
    } catch (err: any) {
      alert("Erreur : " + err.message);
    }
  };

  // Supprime un module après confirmation et met à jour la liste localement.
  const handleDelete = async (course_id: number) => {
    if (!window.confirm(`Supprimer le module #${course_id} ?`)) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/courses/${course_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setModules((prev) => prev.filter((m) => m.course_id !== course_id));
    } catch (err: any) {
      alert("Erreur : " + err.message);
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
        {/* Header */}
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
                    background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    mb: 1,
                    letterSpacing: "-0.5px",
                  }}
                >
                  Gestion des Modules
                </Typography>
                <Typography sx={{ color: "#666", fontWeight: 500 }}>
                  Créez, modifiez et gérez vos modules d’enseignement
                </Typography>
              </Box>

              <Button
                startIcon={<AddCircleOutlineIcon />}
                variant="contained"
                onClick={() => handleOpenDialog()}
                sx={{
                  background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                  color: "#fff",
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 3,
                  py: 1.3,
                  boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #C5A028 0%, #B08020 100%)",
                  },
                }}
              >
                Nouveau Module
              </Button>
            </Stack>
          </Box>
        </motion.div>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filtres stylés */}
        <Stack
          direction="row"
          flexWrap="wrap"
          spacing={2}
          sx={{
            mb: 4,
            background: alpha("#fff", 0.92),
            borderRadius: 4,
            p: 2,
            boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            border: "1px solid",
            borderColor: alpha("#D4AF37", 0.12),
            alignItems: "center",
          }}
        >
          <Select
            displayEmpty
            value={filters.teacher_id}
            onChange={(e) => handleFilterChange("teacher_id", e.target.value)}
            size="small"
            sx={{
              minWidth: { xs: "140px", md: "220px" },
              bgcolor: "#fff",
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              "& .MuiSelect-select": { py: 1 },
            }}
          >
            <MenuItem value="">
              <em>Tous les enseignants</em>
            </MenuItem>
            {teachers.map((t) => (
              <MenuItem key={t.user_id} value={t.user_id}>
                {t.first_name} {t.last_name}
              </MenuItem>
            ))}
          </Select>

          <Select
            displayEmpty
            value={filters.course_type}
            onChange={(e) => handleFilterChange("course_type", e.target.value)}
            size="small"
            sx={{
              minWidth: { xs: "120px", md: "160px" },
              bgcolor: "#fff",
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              "& .MuiSelect-select": { py: 1 },
            }}
          >
            <MenuItem value="">
              <em>Tous types</em>
            </MenuItem>
            {courseTypes.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>

          <TextField
            label="Crédits min"
            type="number"
            size="small"
            value={filters.credits_min}
            onChange={(e) => handleFilterChange("credits_min", e.target.value)}
            sx={{
              width: { xs: "110px", md: "120px" },
              bgcolor: "#fff",
              borderRadius: 2,
              "& .MuiInputBase-input": { py: "10px" },
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          />

          <TextField
            label="Crédits max"
            type="number"
            size="small"
            value={filters.credits_max}
            onChange={(e) => handleFilterChange("credits_max", e.target.value)}
            sx={{
              width: { xs: "110px", md: "120px" },
              bgcolor: "#fff",
              borderRadius: 2,
              "& .MuiInputBase-input": { py: "10px" },
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          />

          <Box sx={{ display: "flex", gap: 1, ml: "auto", flexWrap: "wrap" }}>
            <Button
              variant="contained"
              onClick={handleApplyFilters}
              size="small"
              sx={{
                background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                color: "#fff",
                borderRadius: 2.5,
                textTransform: "none",
                fontWeight: 700,
                px: 2.5,
                py: 1,
                boxShadow: "0 4px 12px rgba(212,175,55,0.25)",
                "&:hover": {
                  background: "linear-gradient(135deg, #C5A028 0%, #B08020 100%)",
                },
              }}
            >
              Filtrer
            </Button>

            <Button
              variant="outlined"
              onClick={handleResetFilters}
              size="small"
              sx={{
                borderRadius: 2.5,
                textTransform: "none",
                fontWeight: 700,
                px: 2,
                py: 0.9,
                borderColor: alpha("#D4AF37", 0.25),
                color: "#5a4a00",
                background: "#fff",
                "&:hover": {
                  background: alpha("#D4AF37", 0.06),
                  borderColor: alpha("#D4AF37", 0.35),
                },
              }}
            >
              Réinitialiser
            </Button>
          </Box>
        </Stack>

        {/* Liste des modules */}
        <Grid container spacing={3}>
          {modules.map((mod: any, i: number) => {
            const teacherName = mod.users
              ? `${mod.users.first_name} ${mod.users.last_name}`
              : teachers.find((t: any) => t.user_id === mod.teacher_id)
                ? `${teachers.find((t: any) => t.user_id === mod.teacher_id).first_name} ${
                    teachers.find((t: any) => t.user_id === mod.teacher_id).last_name
                  }`
                : "—";

            const formationTitle =
              mod.formation_courses?.[0]?.formations?.title ||
              formations.find((f: any) => f.id === mod.formation_courses?.[0]?.formation_id)?.title ||
              "—";

            return (
              <Grid item xs={12} md={6} key={mod.course_id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  whileHover={{ y: -6 }}
                >
                  <Card
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                      transition: "0.3s",
                      position: "relative",
                      overflow: "hidden",
                      border: "1px solid",
                      borderColor: alpha("#D4AF37", 0.1),
                      "&:hover": {
                        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
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
                    <Box display="flex" justifyContent="space-between" gap={2}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
                        <Box
                          sx={{
                            bgcolor: alpha("#D4AF37", 0.1),
                            borderRadius: 2,
                            p: 1.2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <MenuBookIcon sx={{ color: "#D4AF37" }} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="h6" fontWeight={800} noWrap>
                            {mod.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="#666"
                            sx={{
                              mt: 0.5,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {mod.description}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ flexShrink: 0 }}>
                        <IconButton
                          onClick={() => handleOpenDialog(mod)}
                          sx={{ color: "#D4AF37", "&:hover": { bgcolor: alpha("#D4AF37", 0.1) } }}
                          title="Modifier"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(mod.course_id)} title="Supprimer">
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Stack direction="row" spacing={1.5} mt={2} flexWrap="wrap">
                      {formationTitle && (
                        <Chip
                          label={`Formation: ${formationTitle}`}
                          sx={{
                            bgcolor: alpha("#4caf50", 0.15),
                            color: "#1b5e20",
                            fontWeight: 700,
                            borderRadius: 2,
                          }}
                        />
                      )}
                      {teacherName && (
                        <Chip
                          label={`Prof: ${teacherName}`}
                          sx={{
                            bgcolor: alpha("#9c27b0", 0.15),
                            color: "#4a148c",
                            fontWeight: 700,
                            borderRadius: 2,
                          }}
                        />
                      )}
                      {mod.course_type && (
                        <Chip
                          label={`Type: ${mod.course_type}`}
                          sx={{
                            bgcolor: alpha("#2196f3", 0.15),
                            color: "#0d47a1",
                            fontWeight: 700,
                            borderRadius: 2,
                          }}
                        />
                      )}
                      {mod.credits && (
                        <Chip
                          label={`Crédits: ${mod.credits}`}
                          sx={{
                            bgcolor: alpha("#ff9800", 0.15),
                            color: "#e65100",
                            fontWeight: 700,
                            borderRadius: 2,
                          }}
                        />
                      )}
                      {mod.start_date && (
                        <Chip
                          label={`Début: ${new Date(mod.start_date).toLocaleDateString()}`}
                          sx={{
                            bgcolor: alpha("#607d8b", 0.15),
                            color: "#263238",
                            fontWeight: 700,
                            borderRadius: 2,
                          }}
                        />
                      )}
                    </Stack>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>

        {/* Dialog création/édition */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          fullWidth
          maxWidth="sm"
          TransitionProps={{ onEntering: () => window.scrollTo(0, 0) }}
        >
          <DialogTitle
            sx={{ fontWeight: 800, fontSize: "1.4rem", color: "#D4AF37", pr: 6 }}
          >
            {editId ? "Modifier un Module" : "Créer un Module"}
            <IconButton onClick={handleCloseDialog} sx={{ position: "absolute", right: 8, top: 8 }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <TextField
              label="Titre *"
              fullWidth
              margin="normal"
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
            />

            <Select
              fullWidth
              value={formState.formation_id}
              onChange={(e) =>
                setFormState({ ...formState, formation_id: e.target.value as any })
              }
              displayEmpty
              sx={{ mt: 2, mb: 2 }}
            >
              <MenuItem value="" disabled>
                Choisir une formation *
              </MenuItem>
              {formations.map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.title}
                </MenuItem>
              ))}
            </Select>

            <TextField
              label="Description *"
              fullWidth
              multiline
              rows={4}
              margin="normal"
              value={formState.description}
              onChange={(e) =>
                setFormState({ ...formState, description: e.target.value })
              }
            />

            <Select
              fullWidth
              value={formState.teacher_id}
              onChange={(e) =>
                setFormState({ ...formState, teacher_id: e.target.value as any })
              }
              displayEmpty
              sx={{ mt: 2, mb: 2 }}
            >
              <MenuItem value="" disabled>
                Choisir un professeur *
              </MenuItem>
              {teachers.map((t) => (
                <MenuItem key={t.user_id} value={t.user_id}>
                  {t.first_name} {t.last_name} {t.email ? `(${t.email})` : ""}
                </MenuItem>
              ))}
            </Select>

            <TextField
              label="Date de début"
              fullWidth
              margin="normal"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formState.start_date}
              onChange={(e) =>
                setFormState({ ...formState, start_date: e.target.value })
              }
            />

            <TextField
              label="Crédits"
              type="number"
              fullWidth
              margin="normal"
              value={formState.credits}
              onChange={(e) =>
                setFormState({ ...formState, credits: e.target.value })
              }
            />

            <Select
              fullWidth
              value={formState.course_type}
              onChange={(e) =>
                setFormState({ ...formState, course_type: e.target.value as any })
              }
              displayEmpty
              sx={{ mt: 2, mb: 2 }}
            >
              <MenuItem value="" disabled>
                Type de cours *
              </MenuItem>
              {courseTypes.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleCloseDialog}
              variant="outlined"
              sx={{ borderRadius: 3, textTransform: "none", fontWeight: 700 }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                color: "#fff",
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 700,
                "&:hover": {
                  background: "linear-gradient(135deg, #C5A028 0%, #B08020 100%)",
                },
              }}
            >
              {editId ? "Enregistrer" : "Créer"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
