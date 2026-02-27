import  { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Typography, CircularProgress, Button
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function CourseDetailDialog({
  open,
  courseId,
  onClose,
}: {
  open: boolean;  // si la modale est ouverte
  courseId: number | null;
  onClose: () => void;  // fonction pour fermer la modale
}) {
  const API_BASE =
    (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") || import.meta.env.VITE_BACKEND_URL;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Si la modale est fermée ou courseId null, on ne fait rien
    if (!open || courseId == null) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/teacher/courses/${courseId}`, { headers });
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e?.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, courseId]);

  //render
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{loading ? "Chargement…" : (data?.title ?? "Détails du cours")}</DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Stack direction="row" alignItems="center" spacing={2}>
            <CircularProgress size={22} />
            <Typography>Récupération des informations…</Typography>
          </Stack>
        )}
        {error && <Typography color="error">Erreur : {error}</Typography>}
        {!loading && !error && data && (
          <Stack spacing={1.2}>
            <Typography variant="body1"><strong>Titre :</strong> {data.title ?? "—"}</Typography>
            <Typography variant="body2">
              <strong>Statut :</strong>{" "}
              {data.status ??
                (data.start_date
                  ? new Date(data.start_date) > new Date() ? "À venir" : "En cours"
                  : "—")}
            </Typography>
            <Typography variant="body2">
              <strong>Début :</strong>{" "}
              {data.start_date ? new Date(data.start_date).toLocaleString() : "—"}
            </Typography>
            <Typography variant="body2"><strong>Description :</strong> {data.description ?? "—"}</Typography>
            <Typography variant="body2"><strong>Crédits :</strong> {data.credits ?? "—"}</Typography>
            <Typography variant="body2"><strong>Type :</strong> {data.course_type ?? "—"}</Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button startIcon={<CloseIcon />} onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
}
