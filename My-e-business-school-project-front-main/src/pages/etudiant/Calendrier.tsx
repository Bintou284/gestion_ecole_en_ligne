import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
} from "react-big-calendar";
import { fr } from "date-fns/locale";
import { format, parse, startOfWeek, getDay } from "date-fns";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  alpha,
  Tooltip,
  Stack,
  Chip,
} from "@mui/material";
import { motion } from "framer-motion";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import RoomIcon from "@mui/icons-material/Room";
import SchoolIcon from "@mui/icons-material/School";

// Configuration de la localisation pour react-big-calendar
const locales = { fr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const API_BASE_URL = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_BACKEND_URL;

export interface CourseEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  categorie: string;
  room: string;
  teacher: string;
}


const courseColors: Record<string, string> = {
  Algo: "#ffd600",
  Maths: "#c7ecff",
  Oral: "#ffe2e2",
  React: "#c8ffc8",
  Projet: "#ffe082",
};

export default function Calendrier() {
  const [view, setView] = useState<"month" | "week" | "day">("week");
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<CourseEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  let studentId: number | null = null;

  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      studentId = decoded.id;
    } catch (err) {
      console.error("Erreur de décodage du token :", err);
    }
  }

    // useEffect pour récupérer le planning depuis l'API
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!studentId) return;

      try {
        setLoading(true); // Activer le loader
        const res = await fetch(
          `${API_BASE_URL}/api/schedule/student/${studentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error("Erreur serveur");
        const data = await res.json();

        // Formater les données pour react-big-calendar
        const formatted: CourseEvent[] = data.map((slot: any) => ({
          id: slot.slot_id,
          title: slot.courses?.title || "Cours sans titre",
          start: new Date(slot.start_time),
          end: new Date(slot.end_time),
          categorie: slot.courses?.course_type || "Cours",
          room: slot.room || "Non définie",
          teacher: `${
            slot.users_schedule_slots_teacher_idTousers?.first_name || ""
          } ${slot.users_schedule_slots_teacher_idTousers?.last_name || ""}`.trim() || "Non assigné",
        }));

        setEvents(formatted);
      } catch (error) {
        console.error("Erreur de chargement du planning :", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [studentId]);

  // Fonction pour styliser les événements selon leur catégorie
  function eventStyleGetter(event: CourseEvent) {
    return {
      style: {
        backgroundColor: courseColors[event.categorie] || "#fffde7",
        color: "#333",
        borderRadius: "12px",
        border: "none",
        fontWeight: 600,
        fontSize: 15,
        boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
        padding: "6px",
        opacity: 0.95,
        transition: "all 0.3s ease",
        cursor: "pointer",
      },
    };
  }

  // Composant Tooltip personnalisé avec toutes les infos
  const EventTooltip = ({ event }: { event: CourseEvent }) => (
    <Box
      sx={{
        p: 2,
        minWidth: 280,
        background: "linear-gradient(135deg, #fff 0%, #fffef8 100%)",
        borderRadius: 2,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      }}
    >
      <Stack spacing={1.5}>
        {/* Titre du cours */}
        <Box>
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{
              color: "#333",
              mb: 0.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <SchoolIcon sx={{ color: "#D4AF37", fontSize: 20 }} />
            {event.title}
          </Typography>
          <Chip
            label={event.categorie}
            size="small"
            sx={{
              bgcolor: alpha("#D4AF37", 0.15),
              color: "#C5A028",
              fontWeight: 700,
              fontSize: "0.7rem",
            }}
          />
        </Box>

        {/* Horaires */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AccessTimeIcon sx={{ fontSize: 18, color: "#666" }} />
          <Typography variant="body2" sx={{ color: "#666", fontWeight: 600 }}>
            {event.start.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            -{" "}
            {event.end.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>
        </Box>

        {/* Salle */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <RoomIcon sx={{ fontSize: 18, color: "#f44336" }} />
          <Typography variant="body2" sx={{ color: "#333", fontWeight: 700 }}>
            Salle : <span style={{ color: "#f44336" }}>{event.room}</span>
          </Typography>
        </Box>

        {/* Enseignant */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonIcon sx={{ fontSize: 18, color: "#2196f3" }} />
          <Typography variant="body2" sx={{ color: "#333", fontWeight: 600 }}>
            {event.teacher}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );

  const EventWrapper = ({
    event,
    children,
  }: {
    event: CourseEvent;
    children: React.ReactNode;
  }) => (
    <Tooltip
      title={<EventTooltip event={event} />}
      arrow
      placement="top"
      enterDelay={200}
      leaveDelay={100}
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: "transparent",
            maxWidth: "none",
            p: 0,
          },
        },
        arrow: {
          sx: {
            color: "#fff",
          },
        },
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        whileHover={{
          scale: 1.05,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          opacity: 1,
          zIndex: 1000,
        }}
        style={{ height: "100%" }}
      >
        {children}
      </motion.div>
    </Tooltip>
  );

  return (
    <Box
      sx={{
        p: 3,
        background: "linear-gradient(135deg, #FFF9E5 0%, #FFF5D6 100%)",
        minHeight: "85vh",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={0}
          sx={{
            maxWidth: 1200,
            mx: "auto",
            p: 3,
            borderRadius: 5,
            background: "#fff",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            border: "1px solid",
            borderColor: alpha("#D4AF37", 0.15),
          }}
        >
          <Box display="flex" alignItems="center" mb={3} gap={2}>
            <Box
              sx={{
                background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                borderRadius: 3,
                p: 1.5,
                display:"flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
              }}
            >
              <CalendarTodayIcon sx={{ color: "#fff", fontSize: 26 }} />
            </Box>
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{
                background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.5px",
              }}
            >
              Mon planning
            </Typography>
          </Box>

          {loading ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={10}
            >
              <CircularProgress
                size={50}
                thickness={4}
                sx={{ color: "#D4AF37" }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                "& .rbc-calendar": {
                  borderRadius: 3,
                  overflow: "hidden",
                  border: "1px solid #f0f0f0",
                },
                "& .rbc-header": {
                  backgroundColor: alpha("#D4AF37", 0.08),
                  color: "#333",
                  fontWeight: 700,
                  padding: "14px 8px",
                  fontSize: "0.9rem",
                  borderBottom: "2px solid",
                  borderColor: alpha("#D4AF37", 0.2),
                },
                "& .rbc-today": {
                  backgroundColor: alpha("#D4AF37", 0.05),
                },
                "& .rbc-off-range-bg": {
                  backgroundColor: "#fafafa",
                },
                "& .rbc-time-slot": {
                  borderTop: "1px solid #f5f5f5",
                },
                "& .rbc-timeslot-group": {
                  minHeight: 50,
                },
                "& .rbc-current-time-indicator": {
                  backgroundColor: "#D4AF37",
                  height: 2,
                },
                "& .rbc-toolbar": {
                  padding: "16px",
                  backgroundColor: alpha("#D4AF37", 0.03),
                  borderRadius: 3,
                  mb: 2,
                  border: "1px solid #f0f0f0",
                  "& button": {
                    color: "#333",
                    fontWeight: 600,
                    borderRadius: 2,
                    padding: "8px 16px",
                    border: "1px solid #e0e0e0",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: alpha("#D4AF37", 0.1),
                      borderColor: "#D4AF37",
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(212, 175, 55, 0.2)",
                    },
                    "&.rbc-active": {
                      backgroundColor: "#D4AF37",
                      color: "#fff",
                      borderColor: "#D4AF37",
                      boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
                      "&:hover": {
                        backgroundColor: "#C5A028",
                        transform: "translateY(-2px)",
                      },
                    },
                  },
                  "& .rbc-toolbar-label": {
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#333",
                  },
                },
                "& .rbc-event": {
                  "&:hover": {
                    transform: "scale(1.02)",
                  },
                },
              }}
            >
              <BigCalendar
                localizer={localizer}
                culture="fr"
                events={events}
                defaultView={view}
                view={view}
                onView={(v) => setView(v as "month" | "week" | "day")}
                date={date}
                onNavigate={(newDate) => setDate(newDate)}
                style={{ height: 820, borderRadius: 16, background: "#fff" }}
                min={new Date(2025, 0, 1, 8, 0)}
                max={new Date(2025, 0, 1, 20, 0)}
                messages={{
                  week: "Semaine",
                  month: "Mois",
                  day: "Jour",
                  today: "Aujourd'hui",
                  agenda: "Agenda",
                  previous: "Précédent",
                  next: "Suivant",
                  noEventsInRange: "Aucun cours prévu pour cette période.",
                  showMore: (total) => `+ ${total} plus`,
                }}
                popup
                eventPropGetter={eventStyleGetter}
                components={{
                  event: ({ event, title }) => (
                    <EventWrapper event={event as CourseEvent}>
                      <Typography variant="body2" fontWeight={600}>
                        {title}
                      </Typography>
                    </EventWrapper>
                  ),
                }}
              />
            </Box>
          )}
        </Paper>
      </motion.div>
    </Box>
  );
}