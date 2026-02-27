import { useEffect, useMemo, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  CircularProgress,
  Alert,
  alpha,
  Stack,
  Chip,
} from "@mui/material";
import { motion } from "framer-motion";
import DeleteIcon from "@mui/icons-material/Delete";
import SchoolIcon from "@mui/icons-material/School";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ProgrammeAdd_PopUp from "./ProgrammeAdd_PopUp";
import { useLocation } from "react-router-dom";

type FormationApi = {
  formation_id: number;
  title: string;
  description: string | null;
  mode: string | null;
  duration: string | null;
  level: string | null;
};

type FormationLike = Partial<FormationApi> & { id?: number | null };

interface Programme {
  id: number;
  nom: string;
  description?: string | null;
  mode?: string | null;
  duration?: string | null;
  level?: string | null;
}

const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api`;

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

const resolveFormationId = (formation: FormationLike): number | null => {
  if (formation.formation_id != null) return formation.formation_id;
  if (formation.id != null) return formation.id;
  return null;
};

export default function Programmes() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const location = useLocation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<FormationApi | null>(null);

  const token = useMemo(() => getTokenFromAnywhere() ?? "", []);

  useEffect(() => {
    if (location.state?.openCreate) {
      openCreate();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchFormations = async () => {
    try {
      setLoading(true);
      setError(null);
      setUnauthorized(false);

      const res = await fetch(`${API_BASE}/formations`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur ${res.status}: ${text}`);
      }

      const data: FormationLike[] = await res.json();
      const mapped = data.reduce<Programme[]>((acc, f) => {
        const id = resolveFormationId(f);
        if (!id) return acc;
        acc.push({
          id,
          nom: f.title ?? "Programme sans titre",
          description: f.description ?? null,
          mode: f.mode ?? null,
          duration: f.duration ?? null,
          level: f.level ?? null,
        });
        return acc;
      }, []);
      setProgrammes(mapped);
    } catch (e: any) {
      setError(e?.message || "Erreur lors du chargement des programmes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Supprimer ce programme ?")) return;
    try {
      const res = await fetch(`${API_BASE}/formations/${id}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.status === 401) return setUnauthorized(true);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setProgrammes((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      alert(e?.message || "Suppression impossible");
    }
  };

  const handleCreated = (f: FormationApi) => {
    const id = resolveFormationId(f);
    if (!id) return;
    setProgrammes((prev) => [
      ...prev,
      {
        id,
        nom: f.title ?? "Programme sans titre",
        description: f.description ?? null,
        mode: f.mode ?? null,
        duration: f.duration ?? null,
        level: f.level ?? null,
      },
    ]);
  };

  const handleUpdated = (f: FormationApi) => {
    const id = resolveFormationId(f);
    if (!id) return;
    setProgrammes((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              id,
              nom: f.title ?? "Programme sans titre",
              description: f.description ?? null,
              mode: f.mode ?? null,
              duration: f.duration ?? null,
              level: f.level ?? null,
            }
          : p
      )
    );
  };

  const openCreate = () => {
    setSelected(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const openEdit = (p: Programme) => {
    setSelected({
      formation_id: p.id,
      title: p.nom,
      description: p.description ?? null,
      mode: p.mode ?? null,
      duration: p.duration ?? null,
      level: p.level ?? null,
    });
    setDialogMode("edit");
    setDialogOpen(true);
  };

  useEffect(() => {
    fetchFormations();
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #FFF9E5 0%, #FFF3D0 100%)",
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        {/* Header section */}
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
                    background:
                      "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    mb: 1,
                    letterSpacing: "-0.5px",
                  }}
                >
                  Gestion des Formations
                </Typography>
                <Typography sx={{ color: "#666", fontWeight: 500 }}>
                  Créez, modifiez et gérez vos formations facilement
                </Typography>
              </Box>

              <Button
                startIcon={<AddCircleOutlineIcon />}
                variant="contained"
                onClick={openCreate}
                sx={{
                  background:
                    "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                  color: "#fff",
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 3,
                  py: 1.3,
                  boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #C5A028 0%, #B08020 100%)",
                  },
                }}
              >
                Nouvelle Formation
              </Button>
            </Stack>
          </Box>
        </motion.div>

        {unauthorized && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Accès refusé (401). Vérifie tes droits.
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress sx={{ color: "#D4AF37" }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : programmes.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Aucun programme disponible.
          </Alert>
        ) : (
          <Stack spacing={3}>
            {programmes.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -6 }}
              >
                <Card
                  onClick={() => openEdit(p)}
                  sx={{
                    borderRadius: 4,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    bgcolor: "#fff",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor: alpha("#D4AF37", 0.1),
                    position: "relative",
                    overflow: "hidden",
                    "&:hover": {
                      boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
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
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                        <Box
                          sx={{
                            bgcolor: alpha("#D4AF37", 0.1),
                            borderRadius: 2,
                            p: 1.2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <SchoolIcon sx={{ color: "#D4AF37" }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight={800}>
                            {p.nom}
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
                            {p.description || "Aucune description fournie."}
                          </Typography>
                        </Box>
                      </Box>

                      <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p.id);
                        }}
                      >
                      </Button>
                    </Box>

                    <Stack direction="row" spacing={1.5} mt={2}>
                      {p.level && (
                        <Chip
                          label={`Niveau: ${p.level}`}
                          sx={{
                            bgcolor: alpha("#4caf50", 0.15),
                            color: "#2e7d32",
                            fontWeight: 700,
                            borderRadius: 2,
                          }}
                        />
                      )}
                      {p.mode && (
                        <Chip
                          label={`Modalité: ${p.mode}`}
                          sx={{
                            bgcolor: alpha("#2196f3", 0.15),
                            color: "#0d47a1",
                            fontWeight: 700,
                            borderRadius: 2,
                          }}
                        />
                      )}
                      {p.duration && (
                        <Chip
                          label={`Durée: ${p.duration}`}
                          sx={{
                            bgcolor: alpha("#ff9800", 0.15),
                            color: "#e65100",
                            fontWeight: 700,
                            borderRadius: 2,
                          }}
                        />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Stack>
        )}

        <ProgrammeAdd_PopUp
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          mode={dialogMode}
          initial={selected ?? undefined}
          onCreated={handleCreated}
          onUpdated={handleUpdated}
        />
      </Container>
    </Box>
  );
}
