import React, { useMemo, useState, useEffect } from "react";
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
  Select,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Stack,
  Divider,
  GlobalStyles,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import TodayIcon from "@mui/icons-material/Today";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { usePlanningData } from "../../hooks/usePlanningData";
import type { SlotEvent, FormData } from "../../types/planning.types";
import RecurrenceForm from "../../components/planning/RecurrenceForm";

// --- Localizer FR ---
const locales = { fr } as const;
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// --- Palette & helpers ---
const UI = {
  bg: "#F8FAFF",
  card: "#ffffff",
  primary: "#6b7bff",
  primaryDark: "#5464e8",
  accent: "#17c3b2",
  grid: "#e8ecff",
  weekend: "#fbf2ff",
  today: "#eef5ff",
  timebar: "#94a3b8",
};

const colorPalette = [
  "#9DC2FF", "#FFB3BA", "#FFDFA3", "#BAFFC9", "#CBB2FE",
  "#FFB3E6", "#8BE0D4", "#FFCFD2", "#BDE0FE", "#FFF5A5",
  "#EBCB8B", "#C4F1BE", "#C8B6FF", "#FFDAC1", "#B5EAD7",
];
const getCourseColor = (courseId?: number) =>
  typeof courseId === "number" ? colorPalette[courseId % colorPalette.length] : "#e0e0e0";

// --- Toolbar FR personnalisée ---
function ToolbarFR(props: any) {
  const { label, onNavigate, onView, view } = props;
  return (
    <Box
      position="sticky"
      top={0}
      zIndex={2}
      sx={{
        backdropFilter: "saturate(110%) blur(6px)",
        background: "linear-gradient(135deg, #fff 0%, #fffef8 100%)",
        borderRadius: 3,
        p: 2,
        mb: 3,
        boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
        border: "1px solid",
        borderColor: "rgba(212, 175, 55, 0.2)",
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            aria-label="Précédent"
            onClick={() => onNavigate("PREV")}
            size="small"
            sx={{
              backgroundColor: "rgba(212, 175, 55, 0.1)",
              "&:hover": { backgroundColor: "rgba(212, 175, 55, 0.2)" },
            }}
          >
            <ArrowBackIosNewIcon fontSize="small" sx={{ color: "#D4AF37" }} />
          </IconButton>

          <Button
            onClick={() => onNavigate("TODAY")}
            startIcon={<TodayIcon />}
            variant="contained"
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 700,
              background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
              color: "#fff",
              "&:hover": {
                background: "linear-gradient(135deg, #C5A028 0%, #B08020 100%)",
              },
            }}
          >
            Aujourd'hui
          </Button>

          <IconButton
            aria-label="Suivant"
            onClick={() => onNavigate("NEXT")}
            size="small"
            sx={{
              backgroundColor: "rgba(212, 175, 55, 0.1)",
              "&:hover": { backgroundColor: "rgba(212, 175, 55, 0.2)" },
            }}
          >
            <ArrowForwardIosIcon fontSize="small" sx={{ color: "#D4AF37" }} />
          </IconButton>

          <Typography variant="h6" fontWeight={800} ml={1} sx={{ color: "#D4AF37" }}>
            {label}
          </Typography>
        </Stack>

      <ToggleButtonGroup
        value={view}
        exclusive
        onChange={(_e, nextView) => {
          if (nextView) onView(nextView); 
        }}
        size="small"
        sx={{
          "& .MuiToggleButton-root": {
            borderColor: "rgba(212,175,55,0.3)",
            color: "#D4AF37",
            "&.Mui-selected": {
              background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
              color: "#fff",
              "&:hover": {
                background: "linear-gradient(135deg, #C5A028 0%, #B08020 100%)",
              },
            },
          },
        }}
      >
        <ToggleButton value="month">Mois</ToggleButton>
        <ToggleButton value="week">Semaine</ToggleButton>
        <ToggleButton value="day">Jour</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>

  );
}

function useDayBounds(current: Date) {
  return useMemo(() => {
    const min = new Date(current); min.setHours(8, 0, 0, 0);
    const max = new Date(current); max.setHours(20, 0, 0, 0);
    return { min, max };
  }, [current]);
}

export default function PlanningAdmin() {
  const {
    events,
    teachers,
    formations,
    filteredCourses,
    loading,
    error,
    setError,
    fetchCoursesByFormation,
    handleSaveSlot,
    handleDeleteSlot,
  } = usePlanningData();

  const [view, setView] = useState<"month" | "week" | "day">("week");
  const [date, setDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [creationType, setCreationType] = useState<"button" | "cell">("button");
  const [currentSlot, setCurrentSlot] = useState<SlotEvent | null>(null);
  const [selectedFormationFilter, setSelectedFormationFilter] = useState<string>("");

  const [formData, setFormData] = useState<FormData>({
    course_id: "",
    formation_id: "",
    teacher_id: "",
    room: "",
    date: "",
    start_time: "09:00",
    end_time: "11:00",
    is_recurring: false,
    recurrence_type: "weekly",
    recurrence_mode: "day",
    recurrence_count: 1,
  });

  const filteredEvents = selectedFormationFilter
    ? events.filter((e) => e.formation_id === Number(selectedFormationFilter))
    : events;

  const location = useLocation();
  useEffect(() => {
    if (location.state?.openCreate) {
      handleCreateFromButton();
      // Nettoie l'état pour éviter la réouverture en cas de refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (formData.formation_id) fetchCoursesByFormation(formData.formation_id);
  }, [formData.formation_id]);

  const handleCreateFromButton = () => {
    setModalMode("create"); setCreationType("button");
    const today = new Date();
    setFormData((prev: FormData) => ({ ...prev, course_id: "", formation_id: selectedFormationFilter || "", teacher_id: "", room: "", date: today.toISOString().split("T")[0], start_time: "09:00", end_time: "11:00", is_recurring: false, recurrence_type: "weekly", recurrence_mode: "day", recurrence_count: 1 }));
    setCurrentSlot(null); setShowModal(true);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setModalMode("create"); setCreationType("cell");
    setFormData((prev: FormData) => ({ ...prev, course_id: "", formation_id: selectedFormationFilter || "", teacher_id: "", room: "", date: start.toISOString().split("T")[0], start_time: start.toTimeString().slice(0, 5), end_time: end.toTimeString().slice(0, 5), is_recurring: false, recurrence_type: "weekly", recurrence_mode: "day", recurrence_count: 1 }));
    setCurrentSlot(null); setShowModal(true);
  };

  const handleSelectEvent = (event: SlotEvent) => {
    setModalMode("edit"); setCreationType("button"); setCurrentSlot(event);
    const startDate = new Date(event.start);
    setFormData({ course_id: event.course_id?.toString() || "", formation_id: event.formation_id?.toString() || "", teacher_id: event.teacher_id?.toString() || "", room: event.room || "", date: startDate.toISOString().split("T")[0], start_time: startDate.toTimeString().slice(0, 5), end_time: event.end.toTimeString().slice(0, 5), is_recurring: false, recurrence_type: "weekly", recurrence_mode: "day", recurrence_count: 1 });
    setShowModal(true);
  };

  const handleFormChange = (field: string, value: any) => setFormData((prev: FormData) => ({ ...prev, [field]: value }));

  const handleSave = async () => { const ok = await handleSaveSlot(formData, modalMode, currentSlot); if (ok) setShowModal(false); };
  const handleDelete = async () => { if (!currentSlot?.slot_id) return; if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce créneau ?")) return; const ok = await handleDeleteSlot(currentSlot.slot_id); if (ok) setShowModal(false); };

  // Styles d'événements
  function eventStyleGetter(event: SlotEvent) {
    const backgroundColor = getCourseColor(event.course_id);
    return {
      className: "event-card",
      style: {
        background: `linear-gradient(180deg, ${backgroundColor} 0%, ${backgroundColor}cc 100%)`,
        color: "#1f2937",
        borderRadius: 12,
        border: `1px solid #0000000d`,
        fontWeight: 700,
        fontSize: 13,
        boxShadow: "0 6px 16px #00000012",
        padding: 6,
        opacity: 0.98,
      },
    } as const;
  }

  const EventWrapper = ({ children }: { event: SlotEvent; children: React.ReactNode }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      {children}
    </motion.div>
  );

  const { min, max } = useDayBounds(date);

  // Formats FR
  const formats = {
    agendaHeaderFormat: ({ start, end }: any, c: any, l: any) => `${l.format(start, "d MMMM yyyy", c)} – ${l.format(end, "d MMMM yyyy", c)}`,
    dayHeaderFormat: (d: Date, c: any, l: any) => l.format(d, "EEEE d MMMM yyyy", c),
    dayRangeHeaderFormat: ({ start, end }: any, c: any, l: any) => `${l.format(start, "d MMM", c)} – ${l.format(end, "d MMM yyyy", c)}`,
    dayFormat: (d: Date, c: any, l: any) => l.format(d, "EEE dd", c),
    weekdayFormat: (d: Date, c: any, l: any) => l.format(d, "EEEE", c),
    monthHeaderFormat: (d: Date, c: any, l: any) => l.format(d, "MMMM yyyy", c),
    timeGutterFormat: (d: Date, c: any, l: any) => l.format(d, "HH:mm", c),
    eventTimeRangeFormat: ({ start, end }: any, c: any, l: any) => `${l.format(start, "HH:mm", c)} – ${l.format(end, "HH:mm", c)}`,
  } as const;


  // Mise en forme des jours
  const dayPropGetter = (date: Date) => {
    const isWeekend = [0, 6].includes(date.getDay());
    const isToday = new Date(date).toDateString() === new Date().toDateString();
    return {
      style: {
        backgroundColor: isToday ? UI.today : isWeekend ? UI.weekend : UI.card,
      },
    } as const;
  };

  return (
    <Box
      sx={{
        p: 3,
        minHeight: "85vh",
        background: "linear-gradient(135deg, #FFF9E5 0%, #FFF3D0 100%)",
      }}
    >
      <GlobalStyles styles={{
        ".rbc-time-view": { borderColor: UI.grid },
        ".rbc-time-header": { borderColor: UI.grid },
        ".rbc-time-header-content": { borderLeft: `1px solid ${UI.grid}` },
        ".rbc-time-content": { borderTop: `1px solid ${UI.grid}` },
        ".rbc-timeslot-group": { borderColor: UI.grid },
        ".rbc-time-gutter": { color: UI.timebar },
        ".rbc-today": { backgroundColor: `${UI.today} !important` },
        ".event-card": { transition: "transform .15s ease, box-shadow .2s ease" },
        ".event-card:hover": { transform: "translateY(-1px)", boxShadow: "0 10px 24px #0000001f" },
        ".rbc-time-content > * + * > *": { borderLeft: `1px solid ${UI.grid}` },
        ".rbc-allday-cell": { display: "none" },
      }} />

      {/* En-tête */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems="center"
        justifyContent="space-between"
        spacing={3}
        sx={{
          maxWidth: 1200,
          mx: "auto",
          mb: 5,
          p: { xs: 3, md: 5 },
          borderRadius: 5,
          boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
          background: "linear-gradient(135deg, #fff 0%, #fffef8 100%)",
          border: "1px solid",
          borderColor: "rgba(212, 175, 55, 0.2)",
        }}
      >
        <Box>
          <Typography
            variant="h3"
            fontWeight={900}
            sx={{
              background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 1,
              letterSpacing: "-0.5px",
            }}
          >
            Gestion du planning
          </Typography>
          <Typography sx={{ color: "#666", fontWeight: 500 }}>
            Créez, modifiez et gérez vos créneaux facilement
          </Typography>
        </Box>

        <Button
          startIcon={<AddCircleOutlineIcon />}
          variant="contained"
          onClick={handleCreateFromButton}
          sx={{
            background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
            color: "#fff",
            borderRadius: 3,
            textTransform: "none",
            fontWeight: 700,
            px: 3,
            py: 1.3,
            boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #C5A028 0%, #B08020 100%)",
            },
          }}
        >
          Créer un créneau
        </Button>
      </Stack>


      {/* Carte calendrier */}
      <Paper elevation={3} sx={{ maxWidth: 1200, mx: "auto", p: 3, borderRadius: 4, background: UI.card }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Typography variant="h5" fontWeight={800}>
            {selectedFormationFilter ? `Planning – ${formations.find(f => f.formation_id === Number(selectedFormationFilter))?.title || "Formation"}` : "Planning – Toutes les formations"}
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" color="text.secondary">Filtrer par formation :</Typography>
            <Select size="small" value={selectedFormationFilter} onChange={(e) => setSelectedFormationFilter(e.target.value)} sx={{ minWidth: 250, fontWeight: 700, borderRadius: 2 }} displayEmpty>
              <MenuItem value=""><em>Toutes les formations</em></MenuItem>
              {formations.map((f) => (
                <MenuItem key={f.formation_id} value={f.formation_id}>{f.title} {f.level && `(${f.level})`}</MenuItem>
              ))}
            </Select>
            {selectedFormationFilter && (<Chip label={`${filteredEvents.length} créneaux`} color="primary" size="small" />)}
          </Box>
        </Box>



        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
        ) : (
          <BigCalendar
            localizer={localizer}
            culture="fr"
            events={filteredEvents}
            defaultView={view}
            view={view}
            onView={(v) => setView(v as any)}
            date={date}
            onNavigate={(d) => setDate(d)}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            style={{ height: 650, borderRadius: 16, background: UI.card }}
            min={min}
            max={max}
            dayPropGetter={dayPropGetter}
            messages={{ week: "Semaine", month: "Mois", day: "Jour", today: "Aujourd'hui", agenda: "Agenda", previous: "Précédent", next: "Suivant", showMore: (t) => `+ ${t} de plus`, date: "Date", time: "Heure", event: "Événement", allDay: "Toute la journée", noEventsInRange: "Aucun événement dans cette période" }}
            popup
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: ToolbarFR, event: ({ event }) => (
                <EventWrapper event={event as SlotEvent}>
                  <Typography variant="body2" fontWeight={800} lineHeight={1.15}>{(event as SlotEvent).title}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>{(event as SlotEvent).room}{(event as SlotEvent).teacher ? ` • ${(event as SlotEvent).teacher}` : ""}</Typography>
                </EventWrapper>
              )
            }}
            formats={formats}
          />
        )}
      </Paper>

      {/* Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
            color: "white",
            fontWeight: 800,
            fontSize: 22,
          }}
        >
          {modalMode === "edit" ? "Modifier le créneau" : "Créer un nouveau créneau"}
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          {error && (<Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>)}

          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {/* Formation */}
            {!selectedFormationFilter ? (
              <FormControl fullWidth>
                <InputLabel>Formation *</InputLabel>
                <Select value={formData.formation_id} onChange={(e) => handleFormChange("formation_id", e.target.value)} label="Formation *">
                  <MenuItem value="">Sélectionner une formation</MenuItem>
                  {formations.map((f) => (
                    <MenuItem key={f.formation_id} value={f.formation_id}>{f.title}{f.level ? ` (${f.level})` : ""}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Formation</Typography>
                <Box sx={{ p: 2, backgroundColor: "#f5f7ff", borderRadius: 2, border: `2px solid ${UI.grid}` }}>
                  <Typography variant="body1" fontWeight={700}>
                    {formations.find(f => f.formation_id === Number(selectedFormationFilter))?.title}
                    {formations.find(f => f.formation_id === Number(selectedFormationFilter))?.level && ` (${formations.find(f => f.formation_id === Number(selectedFormationFilter))?.level})`}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Cours */}
            <FormControl fullWidth disabled={!formData.formation_id}>
              <InputLabel>Cours *</InputLabel>
              <Select value={formData.course_id} onChange={(e) => handleFormChange("course_id", e.target.value)} label="Cours *">
                <MenuItem value="">{!formData.formation_id ? "Sélectionnez d'abord une formation" : filteredCourses.length === 0 ? "Aucun cours disponible" : "Sélectionner un cours"}</MenuItem>
                {filteredCourses.map((c) => (
                  <MenuItem key={c.course_id} value={c.course_id}>
                    {c.title}
                    {c.course_type && (<Chip label={c.course_type} size="small" sx={{ ml: 1 }} />)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Professeur */}
            <FormControl fullWidth>
              <InputLabel>Professeur</InputLabel>
              <Select value={formData.teacher_id} onChange={(e) => handleFormChange("teacher_id", e.target.value)} label="Professeur">
                <MenuItem value=""><em>Aucun professeur assigné</em></MenuItem>
                {teachers.map((t) => (
                  <MenuItem key={t.user_id} value={t.user_id}>{t.first_name} {t.last_name}<Typography variant="caption" sx={{ ml: 1, color: "text.secondary" }}>({t.email})</Typography></MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Salle */}
            <TextField label="Salle " value={formData.room} onChange={(e) => handleFormChange("room", e.target.value)} fullWidth required />

            {/* Récurrence */}
            {modalMode === "create" && (<RecurrenceForm formData={formData} onFormChange={handleFormChange} />)}

            {/* Date (si création par bouton) */}
            {creationType === "button" && (
              <TextField label="Date" type="date" value={formData.date} onChange={(e) => handleFormChange("date", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            )}

            {/* Heures */}
            <Box display="flex" gap={2}>
              <TextField label="Heure de début" type="time" value={formData.start_time} onChange={(e) => handleFormChange("start_time", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="Heure de fin" type="time" value={formData.end_time} onChange={(e) => handleFormChange("end_time", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            </Box>
          </Box>
        </DialogContent>
<DialogActions sx={{ p: 3 }}>
  {modalMode === "edit" && (
    <Button
      onClick={handleDelete}
      color="error"
      variant="contained"
      sx={{
        mr: "auto",
        fontWeight: 700,
        textTransform: "none",
        boxShadow: "0 4px 12px rgba(244, 67, 54, 0.3)",
        "&:hover": { boxShadow: "0 6px 16px rgba(244, 67, 54, 0.4)" },
      }}
    >
      Supprimer
    </Button>
  )}
  <Button
    onClick={() => setShowModal(false)}
    sx={{
      fontWeight: 700,
      textTransform: "none",
      color: "#555",
      "&:hover": { backgroundColor: "#f5f5f5" },
    }}
  >
    Annuler
  </Button>
  <Button
    variant="contained"
    onClick={handleSave}
    sx={{
      background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
      color: "#fff",
      fontWeight: 700,
      textTransform: "none",
      boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
      "&:hover": {
        background: "linear-gradient(135deg, #C5A028 0%, #B08020 100%)",
        boxShadow: "0 6px 16px rgba(212, 175, 55, 0.4)",
      },
    }}
  >
    {modalMode === "edit" ? "Mettre à jour" : "Créer"}
  </Button>
</DialogActions>

      </Dialog>
    </Box>
  );
}
