import  { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import CourseList from "./CourseList";
import EditCourseDialog from "./EditCourseDialog";

export type Course = {
  course_id: number;
  title: string;
  description?: string | null;
  start_date?: string | null;
  credits?: number | null;
  course_type?: string | null;
  formation_courses?: { formations?: { title?: string | null } | null }[];
};

export default function Cours() {
  const [courses, setCourses] = useState<Course[]>([]); // liste des cours
  const [loading, setLoading] = useState(true);         // état de chargement
  const [error, setError] = useState<string | null>(null);  // message d'erreur

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const navigate = useNavigate(); // hook pour naviguer vers la page détail

  const API_BASE =
    (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") || import.meta.env.VITE_BACKEND_URL;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/teacher/courses`, { headers });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <Box sx={{ bgcolor: "#f9fafb", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="md">
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={800}>Mes cours</Typography>
          <Button variant="outlined" onClick={fetchCourses}>Actualiser</Button>
        </Stack>

        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ mt: 6 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Chargement…</Typography>
          </Stack>
        ) : error ? (
          <Card sx={{ borderRadius: 4 }}>
            <CardContent><Typography color="error">Erreur : {error}</Typography></CardContent>
          </Card>
        ) : courses.length === 0 ? (
          <Card sx={{ borderRadius: 4 }}>
            <CardContent><Typography>Vous n’avez aucun cours pour le moment.</Typography></CardContent>
          </Card>
        ) : (
          <CourseList
            courses={courses}
            onDetails={(id) => navigate(`/formateur/cours/${id}`)}
            onEdit={(id) => { setEditId(id); setEditOpen(true); }}
          />
        )}
      </Container>

      <EditCourseDialog
        open={editOpen}
        courseId={editId}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => {
          setCourses((prev) =>
            prev.map((c) => (c.course_id === updated.course_id ? { ...c, ...updated } : c))
          );
        }}
      />
    </Box>
  );
}
