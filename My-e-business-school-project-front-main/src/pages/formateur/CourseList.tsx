import {
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Box,
  Divider,
  Chip,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SchoolIcon from "@mui/icons-material/School";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import type { Course } from "./Cours";

type Props = {
  courses: Course[];
  onDetails: (id: number) => void; // Callback pour voir le détail d’un cours
  onEdit: (id: number) => void; // Callback pour éditer un cours
};

// Fonction utilitaire pour formater une date ISO
const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Fonction pour récupérer le label de la promotion associée au cours
const promoLabel = (c: Course) => {
  const fc = c.formation_courses;
  return fc?.[0]?.formations?.title || "—";
};

export default function CourseList({ courses, onDetails, onEdit }: Props) {
  return (
    <Stack spacing={2}>
      {courses.map((c) => (
        <Card
          key={c.course_id}
          sx={{
            borderRadius: 3,
            border: "1px solid #eee",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            transition: "all 0.15s ease",
            "&:hover": { boxShadow: "0 4px 14px rgba(0,0,0,0.08)" },
          }}
        >
          <CardContent>
            {/* Titre + type */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              sx={{ mb: 1 }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ color: "#111", maxWidth: "80%" }}
                title={c.title}
                noWrap
              >
                {c.title}
              </Typography>
              {c.course_type && (
                <Chip
                  size="small"
                  icon={<LocalOfferIcon sx={{ fontSize: 16 }} />}
                  label={c.course_type}
                  sx={{ bgcolor: "#f3f4f6", color: "#333", fontWeight: 600 }}
                />
              )}
            </Stack>

            {/* Métadonnées */}
            <Stack
              direction="row"
              spacing={3}
              divider={<Divider orientation="vertical" flexItem />}
              sx={{ color: "text.secondary", fontSize: 14, mb: 1.5, flexWrap: "wrap" }}
            >
              <Stack direction="row" spacing={0.6} alignItems="center">
                <CalendarMonthIcon sx={{ fontSize: 18, opacity: 0.7 }} />
                <span>{fmtDate(c.start_date)}</span>
              </Stack>
              <Stack direction="row" spacing={0.6} alignItems="center">
                <SchoolIcon sx={{ fontSize: 18, opacity: 0.7 }} />
                <span>{promoLabel(c)}</span>
              </Stack>
              {typeof c.credits === "number" && <span>{c.credits} ECTS</span>}
            </Stack>

            {/* Description  */}
            {c.description && (
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mb: 2,
                  whiteSpace: "pre-line",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
                title={c.description}
              >
                {c.description}
              </Typography>
            )}

            {/* Actions */}
            <Box textAlign="right">
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => onEdit(c.course_id)}
                  sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
                >
                  Modifier
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  endIcon={<VisibilityIcon />}
                  onClick={() => onDetails(c.course_id)}
                  sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600, px: 2 }}
                >
                  Voir le cours
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
