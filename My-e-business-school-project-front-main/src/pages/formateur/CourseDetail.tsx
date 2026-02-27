import  { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Stack,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  TextField,
  Button,
  IconButton,
  LinearProgress,
  Snackbar,
  Alert,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DescriptionIcon from "@mui/icons-material/Description";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";

type Course = {
  course_id: number;
  title: string;
  description?: string | null;
  start_date?: string | null;
  credits?: number | null;
  course_type?: string | null;
  course_resources?: Resource[];
};

type Resource = {
  resource_id: number;
  title: string;
  description?: string | null;
  file_path?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  is_visible: boolean;
  status_id: number;
  uploaded_at?: string | null;
};

const ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 Mo

const iconForMime = (mime?: string | null) => {
  if (!mime) return <InsertDriveFileIcon sx={{ opacity: 0.7 }} />;
  if (mime.includes("pdf")) return <PictureAsPdfIcon sx={{ color: "#e53935" }} />;
  if (mime.includes("word") || mime.includes("msword")) return <DescriptionIcon sx={{ color: "#1a73e8" }} />;
  return <InsertDriveFileIcon sx={{ opacity: 0.7 }} />;
};

const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

export default function CourseDetail() {
  const { id } = useParams();
  const courseId = Number(id);

  const RAW = (import.meta as any).env?.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
  const API_BASE = RAW.replace(/\/$/, "");
  const ORIGIN = RAW.replace(/\/api\/?$/, "");
  const token = localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "error" }>({
    open: false,
    msg: "",
    sev: "success",
  });

  // Delete dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Resource | null>(null);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchCourse = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await fetch(`${API_BASE}/api/courses/${courseId}`, { headers });
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as Course;
      setCourse(data);
    } catch (e: any) {
      setError(e?.message || "Erreur de chargement");
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, courseId, headers]);

  useEffect(() => {
    if (!Number.isFinite(courseId)) return;
    fetchCourse();
  }, [courseId, fetchCourse]);

  const fullUrl = (p?: string | null) =>
    !p ? "" : p.startsWith("http") ? p : `${ORIGIN}${p}`;

  const total = course?.course_resources?.length || 0;
  const validated = course?.course_resources?.filter((r) => r.is_visible).length || 0;
  const pending = total - validated;

  const dropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer?.files?.[0];
      if (f) handleSelectFile(f);
    };

    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("dragleave", onDragLeave);
      el.removeEventListener("drop", onDrop);
    };
  }, []);

  const handleSelectFile = (f: File) => {
    if (!ALLOWED_MIME.includes(f.type)) {
      setSnack({ open: true, msg: "Type de fichier invalide (PDF, DOC, DOCX uniquement).", sev: "error" });
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setSnack({ open: true, msg: "Fichier trop volumineux (max 100 Mo).", sev: "error" });
      return;
    }
    setFile(f);
    if (!title.trim()) {
      const base = f.name.replace(/\.[^.]+$/, "");
      setTitle(base);
    }
  };

  const openFilePicker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept =
      ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    input.onchange = () => {
      const f = (input.files && input.files[0]) || null;
      if (f) handleSelectFile(f);
    };
    input.click();
  };

  const doUpload = async () => {
    if (!file || !Number.isFinite(courseId)) return;
    try {
      if (file.size > MAX_SIZE_BYTES) {
        setSnack({ open: true, msg: "Fichier trop volumineux (max 100 Mo).", sev: "error" });
        return;
      }
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      if (title.trim()) fd.append("title", title.trim());
      if (desc.trim()) fd.append("description", desc.trim());

      const r = await fetch(`${API_BASE}/api/courses/${courseId}/upload`, {
        method: "POST",
        headers, // seulement Authorization
        body: fd,
      });
      if (!r.ok) throw new Error(await r.text());
      await fetchCourse();
      setSnack({ open: true, msg: "Ressource envoyée. En attente de validation.", sev: "success" });
      setFile(null);
      setTitle("");
      setDesc("");
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message || "Échec de l’upload", sev: "error" });
    } finally {
      setUploading(false);
    }
  };

  const askDelete = (res: Resource) => {
    setToDelete(res);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!toDelete || !course) return;
    try {
      const r = await fetch(
        `${API_BASE}/api/teacher/courses/${course.course_id}/resources/${toDelete.resource_id}`,
        { method: "DELETE", headers }
      );
      if (!r.ok) throw new Error(await r.text());
      setCourse({
        ...course,
        course_resources: (course.course_resources || []).filter((x) => x.resource_id !== toDelete.resource_id),
      });
      setSnack({ open: true, msg: "Ressource supprimée.", sev: "success" });
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message || "Suppression impossible", sev: "error" });
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  return (
    <Box sx={{ bgcolor: "#f6f7fb", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="md">
        {/*  HEADER  */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e6e9f0",
            mb: 3,
            overflow: "hidden",
            bgcolor: "#fff",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: "#eef3ff",
                    color: "#1a73e8",
                    width: 44,
                    height: 44,
                    fontWeight: 800,
                  }}
                >
                  {course?.title?.[0]?.toUpperCase() || "C"}
                </Avatar>
                <Stack spacing={0.2}>
                  <Typography variant="h6" fontWeight={800}>
                    {course?.title ?? "Cours"}
                  </Typography>
                  {course?.description && (
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {course.description}
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Stack>

            {/* Meta chips + stats */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 2 }} alignItems="center">
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Chip
                  size="small"
                  icon={<LocalOfferIcon sx={{ fontSize: 16 }} />}
                  label={course?.course_type || "Type : —"}
                  sx={{ bgcolor: "#f3f4f6" }}
                />
                <Chip
                  size="small"
                  icon={<RocketLaunchIcon sx={{ fontSize: 16 }} />}
                  label={`${typeof course?.credits === "number" ? course?.credits : "—"} ECTS`}
                  sx={{ bgcolor: "#f3f4f6" }}
                />
                <Chip
                  size="small"
                  icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
                  label={`Début : ${fmtDate(course?.start_date)}`}
                  sx={{ bgcolor: "#f3f4f6" }}
                />
              </Stack>

              <Divider flexItem orientation="vertical" sx={{ display: { xs: "none", sm: "block" }, mx: 1 }} />

              <Stack direction="row" spacing={1}>
                <Chip size="small" color="default" label={`Ressources : ${total}`} sx={{ fontWeight: 700 }} />
                <Chip size="small" color="success" label={`Validées : ${validated}`} sx={{ fontWeight: 700 }} />
                <Chip size="small" color="warning" label={`En attente : ${pending}`} sx={{ fontWeight: 700 }} />
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px dashed",
            borderColor: isDragging ? "#1a73e8" : "#d9dfe8",
            bgcolor: isDragging ? "#f0f6ff" : "#fff",
            transition: "all .15s ease",
          }}
        >
          <CardHeader
            title="Ajouter une ressource"
            subheader="Formats acceptés : PDF, DOC, DOCX (max 100 Mo)"
            sx={{
              pb: 0,
              "& .MuiCardHeader-title": { fontWeight: 700 },
              "& .MuiCardHeader-subheader": { color: "text.secondary" },
            }}
          />
          <CardContent>
            <Stack spacing={2}>
              <Box
                ref={dropRef}
                onClick={openFilePicker}
                sx={{
                  borderRadius: 2,
                  border: "1px dashed",
                  borderColor: isDragging ? "#1a73e8" : "#e5e7eb",
                  bgcolor: isDragging ? "#eaf2ff" : "#fafbfd",
                  p: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all .12s ease",
                  "&:hover": { borderColor: "#c7cdd8" },
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 34, opacity: 0.9 }} />
                <Typography sx={{ mt: 1, fontWeight: 700 }}>
                  Glissez-déposez un fichier ici, ou cliquez pour parcourir
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {file
                    ? `Sélectionné : ${file.name} (${Math.round(file.size / 1024)} Ko)`
                    : "Aucun fichier sélectionné"}
                </Typography>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Titre (facultatif)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Description (facultative)"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  fullWidth
                />
              </Stack>

              {uploading && <LinearProgress />}

              <Stack direction="row" justifyContent="flex-end">
                <Button
                  variant="contained"
                  onClick={doUpload}
                  disabled={!file || uploading}
                  startIcon={<CloudUploadIcon />}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                >
                  {uploading ? "Envoi…" : "Envoyer la ressource"}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/*  LISTE DES RESSOURCES  */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e6e9f0",
            mt: 3,
            overflow: "hidden",
          }}
        >
          <CardHeader
            title="Mes ressources"
            sx={{
              "& .MuiCardHeader-title": { fontWeight: 800 },
            }}
          />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ p: 3 }}>
                <LinearProgress />
              </Box>
            ) : error ? (
              <Box sx={{ p: 3 }}>
                <Alert severity="error">Erreur : {error}</Alert>
              </Box>
            ) : !course?.course_resources || course.course_resources.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <Typography>Aucune ressource.</Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {course.course_resources.map((r) => (
                  <ListItem
                    key={r.resource_id}
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      borderBottom: "1px solid #f1f3f8",
                      "&:last-of-type": { borderBottom: "none" },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mr: 2 }}>
                      {iconForMime(r.mime_type)}
                    </Stack>

                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography
                            sx={{
                              fontWeight: 700,
                              maxWidth: "100%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={r.title}
                          >
                            {r.title || "Sans titre"}
                          </Typography>
                          <Chip
                            size="small"
                            label={r.is_visible ? "Validée" : "En attente"}
                            color={r.is_visible ? "success" : "warning"}
                            sx={{ height: 22 }}
                          />
                        </Stack>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {r.description || "—"}
                        </Typography>
                      }
                    />

                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={0.5}>
                        {r.file_path && (
                          <Tooltip title="Voir le fichier">
                            <IconButton
                              onClick={() => window.open(fullUrl(r.file_path), "_blank")}
                              size="small"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Supprimer">
                          <span>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => askDelete(r)}
                              disabled={uploading}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Confirm delete */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Supprimer cette ressource ?</DialogTitle>
        <DialogContent>
          <Typography>
            Cette action est définitive. Ressource :{" "}
            <strong>{toDelete?.title || "Sans titre"}</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Annuler</Button>
          <Button color="error" variant="contained" onClick={doDelete}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.sev}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
