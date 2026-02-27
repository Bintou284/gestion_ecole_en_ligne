import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, TextField, Button, CircularProgress, Typography
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";

export default function EditCourseDialog({
  open,
  courseId,
  onClose,
  onSaved,
}: {
  open: boolean;
  courseId: number | null;
  onClose: () => void;
  onSaved: (updated: any) => void;
}) {
  const API_BASE =
    (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") || import.meta.env.VITE_BACKEND_URL;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [values, setValues] = useState({ title: "", description: "" });

  useEffect(() => {
    // Chargement des données du cours lorsque le dialogue s’ouvre
    if (!open || courseId == null) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/courses/${courseId}`, { headers });
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        setValues({
          title: data.title ?? "",
          description: data.description ?? "",
        });
      } catch (e: any) {
        setError(e?.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, courseId]);

  const onChange =
    (k: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [k]: e.target.value }));

  const onSubmit = async () => {
    if (courseId == null) return;
    try {
      setSaving(true);
      setError(null);
      const payload = {
        title: values.title.trim(),
        description: values.description.trim() || null,
      };

      const res = await fetch(`${API_BASE}/api/teacher/courses/${courseId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.text()) || `Erreur ${res.status}`);

      const data = await res.json();
      const updated = data.course ?? data;

      onSaved(updated);  
      onClose();
    } catch (e: any) {
      setError(e?.message || "Erreur d’enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>Modifier le cours</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack direction="row" alignItems="center" spacing={2}>
            <CircularProgress size={22} />
            <Typography>Chargement…</Typography>
          </Stack>
        ) : (
          <Stack spacing={2}>
            {error && <Typography color="error">Erreur : {error}</Typography>}
            <TextField
              label="Nom du module"
              value={values.title}
              onChange={onChange("title")}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={values.description}
              onChange={onChange("description")}
              fullWidth
              multiline
              minRows={3}
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button startIcon={<CloseIcon />} onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <Button
          startIcon={<SaveIcon />}
          variant="contained"
          onClick={onSubmit}
          disabled={saving || loading || !values.title.trim()}
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
