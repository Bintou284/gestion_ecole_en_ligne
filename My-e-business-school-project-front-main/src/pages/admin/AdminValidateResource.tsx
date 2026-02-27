import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

type Resource = {
  resource_id: number;
  title: string;
  description?: string | null;
  file_path?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  course_id: number;
  is_visible: boolean;
  status_id: number;
  uploaded_at?: string;
  course?: { title?: string | null; users?: { first_name?: string | null; last_name?: string | null } | null } | null;
  uploaded_by?: number | null;
  teacher_name?: string | null; 
};

export default function AdminValidateResource() {
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get("focus");
  const navigate = useNavigate();

  const RAW = (import.meta as any).env?.VITE_API_URL || import.meta.env.VITE_BACKEND_URL
  const API_BASE = RAW.replace(/\/$/, "");
  const ORIGIN = RAW.replace(/\/api\/?$/, "");
  const token = localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [resource, setResource] = useState<Resource | null>(null);
  const [pending, setPending] = useState<Resource[]>([]);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // Construit l’URL complète d’un fichier ou d’une ressource.
  const fullUrl = (p?: string | null) =>
    !p ? "" : p.startsWith("http") ? p : `${ORIGIN}${p}`;

  // Convertit une taille en octets en format lisible (Ko, Mo, Go).
  const prettySize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return "";
    const units = ["o", "Ko", "Mo", "Go"];
    let i = 0;
    let v = bytes;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return `${v.toFixed(1)} ${units[i]}`;
  };

  // Détermine le nom du professeur associé à la ressource.
  const teacherLabel = (r: Resource) => {
    if (r.teacher_name) return r.teacher_name;
    const t = r.course?.users;
    if (t?.first_name || t?.last_name) {
      return `${t?.first_name ?? ""} ${t?.last_name ?? ""}`.trim();
    }
    if (r.uploaded_by) return `Prof #${r.uploaded_by}`;
    return "Prof inconnu";
    };

  // Retourne le nom du cours associé à la ressource.
  const courseLabel = (r: Resource) => r.course?.title ?? `Cours #${r.course_id}`;

  // Récupère un extrait court d’un texte (limité en longueur).
  const excerpt = (s?: string | null, max = 160) => {
    if (!s) return "—";
    const clean = s.replace(/\s+/g, " ").trim();
    return clean.length > max ? `${clean.slice(0, max)}…` : clean;
  };

  // Charge en détail une ressource spécifique depuis l’API.
  const loadDetail = async (id: string) => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`${API_BASE}/api/courses/resources/${id}`, { headers });
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as Resource;
      setResource(data);
    } catch (e: any) {
      setErr(e?.message || "Erreur de chargement");
      setResource(null);
    } finally {
      setLoading(false);
    }
  };

  // Charge la liste des ressources en attente de validation.
  const loadPending = async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`${API_BASE}/api/courses/resources`, { headers });
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as Resource[];
      setPending(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e?.message || "Erreur de chargement");
      setPending([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (focusId) loadDetail(focusId);
    else loadPending();
  }, [focusId]);

  // Valide une ressource en envoyant une requête PATCH à l’API.
  const handleApprove = async (id: number) => {
    try {
      const r = await fetch(`${API_BASE}/api/courses/resources/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(await r.text());
      if (focusId) {
        setResource((prev) => (prev ? { ...prev, is_visible: true } : prev));
      } else {
        setPending((prev) => prev.filter((p) => p.resource_id !== id));
      }
    } catch (e: any) {
      alert(`Échec validation : ${e?.message || "Erreur"}`);
    }
  };

  // Ouvre la page de détail d’une ressource en modifiant l’URL.
  const handleOpenDetail = (id: number) => {
    navigate(`/admin/validations/ressources?focus=${id}`);
  };

  // —————————————————— RENDER ——————————————————

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ mt: 8 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Chargement…</Typography>
      </Stack>
    );
  }

  if (err) {
    return (
      <Card sx={{ maxWidth: 1000, mx: "auto", mt: 4, borderRadius: 4 }}>
        <CardContent>
          <Typography color="error">Erreur : {err}</Typography>
        </CardContent>
      </Card>
    );
  }

  // LISTE — pas de focus
  if (!focusId) {
    return (
      <Box sx={{ maxWidth: 1100, mx: "auto", mt: 3, px: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={800}>Ressources en attente</Typography>
          <Button variant="outlined" onClick={loadPending}>Actualiser</Button>
        </Stack>

        {pending.length === 0 ? (
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography>Aucune ressource en attente.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {pending.map((r) => (
              <Grid key={r.resource_id} size={{ xs: 12, md: 6 }}>
                <Card
                  sx={{
                    borderRadius: 4,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid #eee",
                  }}
                >
                  <CardContent sx={{ pb: 1.5 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="h6" fontWeight={700} noWrap title={r.title}>
                        {r.title || "Sans titre"}
                      </Typography>
                      <Chip
                        size="small"
                        color={r.is_visible ? "success" : "warning"}
                        label={r.is_visible ? "Validée" : "En attente"}
                      />
                    </Stack>

                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {excerpt(r.description)}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Stack direction="row" spacing={2} sx={{ color: "text.secondary", fontSize: 14 }}>
                      <span><strong>Cours :</strong> {courseLabel(r)}</span>
                      <span>•</span>
                      <span><strong>Prof :</strong> {teacherLabel(r)}</span>
                    </Stack>

                    <Stack direction="row" spacing={2} sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }}>
                      {r.uploaded_at && (
                        <span>
                          Ajoutée le {new Date(r.uploaded_at).toLocaleString()}
                        </span>
                      )}
                      {r.file_size ? (
                        <>
                          <span>•</span>
                          <span>{prettySize(r.file_size)}</span>
                        </>
                      ) : null}
                      {r.mime_type ? (
                        <>
                          <span>•</span>
                          <span>{r.mime_type}</span>
                        </>
                      ) : null}
                    </Stack>
                  </CardContent>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ p: 1.5, pt: 0, mt: "auto" }}
                    justifyContent="flex-end"
                  >
                    {r.file_path && (
                      <Tooltip title="Voir le fichier">
                        <IconButton onClick={() => window.open(fullUrl(r.file_path), "_blank")}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Valider">
                      <IconButton color="success" onClick={() => handleApprove(r.resource_id)}>
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                    <Button size="small" onClick={() => handleOpenDetail(r.resource_id)}>
                      Ouvrir
                    </Button>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  }

  // DÉTAIL — focus présent
  if (!resource) {
    return (
      <Card sx={{ maxWidth: 900, mx: "auto", mt: 4, borderRadius: 4 }}>
        <CardContent>
          <Typography>Aucune ressource trouvée.</Typography>
          <Button sx={{ mt: 2 }} onClick={() => navigate("/admin/validations/ressources")}>
            Retour à la liste
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 3, px: 1 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate("/admin/validations/ressources")} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={800}>Validation de ressource</Typography>
      </Stack>

      <Card sx={{ borderRadius: 4, border: "1px solid #eee" }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="h6" fontWeight={700}>{resource.title || "Sans titre"}</Typography>
            <Chip
              size="small"
              color={resource.is_visible ? "success" : "warning"}
              label={resource.is_visible ? "Validée" : "En attente"}
            />
          </Stack>

          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
            {resource.description || "—"}
          </Typography>

          <Stack direction="row" spacing={2} sx={{ color: "text.secondary", fontSize: 14, mb: 1 }}>
            <span><strong>Cours :</strong> {courseLabel(resource)}</span>
            <span>•</span>
            <span><strong>Prof :</strong> {teacherLabel(resource)}</span>
          </Stack>

          <Stack direction="row" spacing={2} sx={{ color: "text.secondary", fontSize: 13 }}>
            {resource.uploaded_at && (
              <span>Ajoutée le {new Date(resource.uploaded_at).toLocaleString()}</span>
            )}
            {resource.file_size ? (
              <>
                <span>•</span>
                <span>{prettySize(resource.file_size)}</span>
              </>
            ) : null}
            {resource.mime_type ? (
              <>
                <span>•</span>
                <span>{resource.mime_type}</span>
              </>
            ) : null}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={1.5}>
            {resource.file_path && (
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={() => window.open(fullUrl(resource.file_path), "_blank")}
              >
                Voir le fichier
              </Button>
            )}
            {!resource.is_visible && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleApprove(resource.resource_id)}
              >
                Valider
              </Button>
            )}
            <Button onClick={() => navigate("/admin/validations/ressources")}>Retour à la liste</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}