import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, IconButton, Alert, Stack, Autocomplete, Chip, CircularProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type FormationApi = {
  formation_id: number;
  title: string;
  description: string | null;
  mode: string | null;
  duration: string | null;
  level: string | null;
};

type Teacher = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
};

export type ProgrammeAdd_PopUpProps = {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial?: Partial<FormationApi>;
  onCreated?: (created: FormationApi) => void;
  onUpdated?: (updated: FormationApi) => void;
};

const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api`;

// Recherche un token dans plusieurs emplacements possibles (localStorage ou cookie).
function getTokenFromAnywhere(): string | null {
  const keys = ["token", "authToken", "accessToken", "jwt", "bearer"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  const m = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  if (m?.[1]) return decodeURIComponent(m[1]);
  return null;
}

const niveauOptions = ["Bac+2", "Bac+3", "Bac+4", "Bac+5", "Autre"];
const modaliteOptions = ["Présentiel", "Distanciel", "Hybride", "Alternance", "Initiale", "Continue"];

// Normalise un texte (minuscules + retrait des accents) pour faciliter la recherche.
function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export default function ProgrammeAdd_PopUp({
  open, onClose, mode, initial, onCreated, onUpdated,
}: ProgrammeAdd_PopUpProps) {
  const token = useMemo(() => getTokenFromAnywhere(), []);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("");
  const [modeField, setModeField] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");

  // profs sélectionnés
  const [selectedTeachers, setSelectedTeachers] = useState<Teacher[]>([]);

  // recherche profs (fetch global + filtre local)
  const [teacherQuery, setTeacherQuery] = useState("");
  const [teacherOptions, setTeacherOptions] = useState<Teacher[]>([]);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const fetchedOnceRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-remplit les champs et charge les professeurs liés lorsqu’on ouvre la popup en mode édition.
  useEffect(() => {
    if (open && mode === "edit" && initial) {
      setTitle(initial.title ?? "");
      setLevel(initial.level ?? "");
      setModeField(initial.mode ?? "");
      setDuration(initial.duration ?? "");
      setDescription(initial.description ?? "");
   
      if (initial.formation_id) {
        console.log("initial.formation_id", initial.formation_id);

        (async () => {
          try {
            setTeacherLoading(true);
            const res = await fetch(`${API_BASE}/formations/${initial.formation_id}/teachers`, {
              headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            });
            if (!res.ok) throw new Error(await res.text());
            const teachers: Teacher[] = await res.json();
            setSelectedTeachers(teachers);
          } catch (e: any) {
            setTeacherError(e?.message || "Impossible de charger les professeurs liés.");
          } finally {
            setTeacherLoading(false);
          }
        })();
      }
    }

    if (open && mode === "create") {
      setTitle(""); setLevel(""); setModeField(""); setDuration(""); setDescription("");
      setSelectedTeachers([]);
      setError(null); setSubmitting(false);
    }
  }, [open, mode, initial, token]);

  // Charge une seule fois tous les professeurs lors de l’ouverture de la popup.
  useEffect(() => {
    if (!open) return;
    if (fetchedOnceRef.current) return;

    (async () => {
      try {
        setTeacherLoading(true);
        setTeacherError(null);
        const res = await fetch(`${API_BASE}/teachers/teachers`, {
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (!res.ok) throw new Error(await res.text());
        const data: Teacher[] = await res.json();
        setTeacherOptions(Array.isArray(data) ? data : []);
        fetchedOnceRef.current = true;
      } catch (e: any) {
        setTeacherError(e?.message || "Erreur lors du chargement des professeurs.");
      } finally {
        setTeacherLoading(false);
      }
    })();
  }, [open, token]);

  // Filtre localement la liste des professeurs selon la recherche utilisateur.
  const filteredTeacherOptions = useMemo(() => {
    const q = teacherQuery.trim();
    if (q.length < 2) return teacherOptions;
    const nq = normalize(q);
    return teacherOptions.filter((t) => {
      const hay = `${t.last_name} ${t.first_name} ${t.email}`;
      return normalize(hay).includes(nq);
    });
  }, [teacherQuery, teacherOptions]);

  // Ferme la popup si l’action en cours n’est pas une soumission.
  const handleClose = () => {
    if (!submitting) onClose();
  };

  // Gère la création ou la modification d’une formation puis envoie les données à l’API.
  const handleSubmit = async () => {
    setError(null);
    if (!title.trim() || !modeField.trim()) {
      setError("Titre et Modalité sont obligatoires.");
      return;
    }

    try {
      setSubmitting(true);

      if (mode === "create") {
        const res = await fetch(`${API_BASE}/formations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            mode: modeField.trim(),
            duration: duration.trim() || null,
            level: level.trim() || null,
            teacherIds: selectedTeachers.map((t) => t.user_id),
          }),
        });

        if (!res.ok) throw new Error(await res.text());
        const created: FormationApi = await res.json();
        onCreated?.(created);
        onClose();
      } else {
        if (!initial?.formation_id) throw new Error("formation_id manquant");
        const id = initial.formation_id;

        // 1) update champs
        const resUpdate = await fetch(`${API_BASE}/formations/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            mode: modeField.trim(),
            duration: duration.trim() || null,
            level: level.trim() || null,
          }),
        });
        if (!resUpdate.ok) throw new Error(await resUpdate.text());
        const updated: FormationApi = await resUpdate.json();

        // 2) sync teachers
        const resSync = await fetch(`${API_BASE}/formations/${id}/teachers`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ teacherIds: selectedTeachers.map((t) => t.user_id) }),
        });
        if (!resSync.ok) throw new Error(await resSync.text());

        onUpdated?.(updated);
        onClose();
      }
    } catch (e: any) {
      setError(e?.message || "Action impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  // Formatage de l’affichage d’un professeur dans les suggestions.
  const teacherLabel = (t: Teacher) => `${t.last_name.toUpperCase()} ${t.first_name} — ${t.email}`;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          fontWeight: 800,
          fontSize: "1.4rem",
          color: "#D4AF37",
        }}
      >
        {mode === "create" ? "Créer une Formation" : "Modifier la Formation"}
        <IconButton onClick={handleClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField label="Titre *" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />

          <Autocomplete
            freeSolo
            options={niveauOptions}
            value={level}
            onChange={(_, v) => setLevel(v || "")}
            onInputChange={(_, v) => setLevel(v)}
            renderInput={(params) => <TextField {...params} label="Niveau" fullWidth />}
          />

          <Autocomplete
            freeSolo
            options={modaliteOptions}
            value={modeField}
            onChange={(_, v) => setModeField(v || "")}
            onInputChange={(_, v) => setModeField(v)}
            renderInput={(params) => <TextField {...params} label="Modalité *" fullWidth />}
          />

          <TextField
            label="Durée"
            placeholder="ex: 2 ans, 6 mois…"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            fullWidth
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={4}
          />

          {/* Sélection des profs (fetch global + filtre local) */}
          <Autocomplete
            multiple
            options={filteredTeacherOptions}
            value={selectedTeachers}
            onChange={(_, newVal) => {
              const uniq = Array.from(new Map(newVal.map(v => [v.user_id, v])).values());
              setSelectedTeachers(uniq);
            }}
            getOptionLabel={teacherLabel}
            isOptionEqualToValue={(option, value) => option.user_id === value.user_id}
            filterSelectedOptions
            filterOptions={(x) => x}
            onInputChange={(_, newInput) => setTeacherQuery(newInput)}
            loading={teacherLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Professeurs"
                placeholder="Rechercher des professeurs…"
                helperText={
                  teacherError
                    ? teacherError
                    : teacherQuery.trim().length < 2
                      ? "Tape au moins 2 lettres pour filtrer"
                      : `${filteredTeacherOptions.length} résultat(s)`
                }
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {teacherLoading ? <CircularProgress size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.slice(0, 3).map((option, index) => (
                <Chip {...getTagProps({ index })} key={option.user_id} label={teacherLabel(option)} />
              ))
            }
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={submitting}
          sx={{
            borderColor: "#D4AF37",
            color: "#D4AF37",
            "&:hover": {
              borderColor: "#b8962f",
              color: "#b8962f",
            }
          }}
        >
          Annuler
        </Button>

        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          sx={{
            backgroundColor: "#D4AF37",
            "&:hover": {
              backgroundColor: "#b8962f",
            }
          }}
        >
          {submitting
            ? (mode === "create" ? "Création…" : "Modification…")
            : (mode === "create" ? "Créer la Formation" : "Modifier")}
        </Button>
      </DialogActions>

    </Dialog>
  );
}