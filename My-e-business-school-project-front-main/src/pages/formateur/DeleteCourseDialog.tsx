import  { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Stack, Typography, Button, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";

export default function DeleteCourseDialog({
  open,
  courseId,
  onClose,
  onDeleted,
}: {
  open: boolean;
  courseId: number | null;
  onClose: () => void;
  onDeleted: (deletedId: number) => void;
}) {
  const API_BASE =
    (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") || import.meta.env.VITE_BACKEND_URL;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction exécutée lorsqu'on confirme la suppression
  const onConfirm = async () => {
    if (courseId == null) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/teacher/courses/${courseId}`, {
        method: "DELETE",
        headers,
      });
      if (!(res.status === 204 || res.ok)) {
        const txt = await res.text();
        throw new Error(txt || `Erreur ${res.status}`);
      }
      onDeleted(courseId);
      onClose();
    } catch (e: any) {
      setError(e?.message || "Suppression impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} fullWidth maxWidth="xs">
      <DialogTitle>Supprimer ce cours ?</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          {error && <Typography color="error">Erreur : {error}</Typography>}
          <Typography>Cette action est définitive.</Typography>
          {loading && (
            <Stack direction="row" alignItems="center" spacing={2}>
              <CircularProgress size={22} />
              <Typography>Suppression en cours…</Typography>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button startIcon={<CloseIcon />} onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button startIcon={<DeleteIcon />} color="error" variant="contained" onClick={onConfirm} disabled={loading}>
          Supprimer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
