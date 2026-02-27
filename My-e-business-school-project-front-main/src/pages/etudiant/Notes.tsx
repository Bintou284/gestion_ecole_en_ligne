import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Container,
  Card,
  CardContent,
  Chip,
  alpha,
} from "@mui/material";
import { motion } from "framer-motion";
import GradeIcon from "@mui/icons-material/Grade";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SchoolIcon from "@mui/icons-material/School";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FilterListIcon from "@mui/icons-material/FilterList";

interface Note {
  id: number;
  module: string;
  note: number;
  date: string;
}

const notesData: Note[] = [
  { id: 1, module: "Math", note: 18, date: "12/08/2025" },
  { id: 2, module: "Anglais", note: 15, date: "05/09/2025" },
  { id: 3, module: "Physique", note: 13, date: "20/09/2025" },
  { id: 4, module: "Math", note: 9, date: "25/09/2025" },
];

export default function Notes() {
  // State pour le filtre par module
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  // State pour le filtre par note (high, medium, low)
  const [noteFilter, setNoteFilter] = useState<string>("all");

  // Fonction pour déterminer la couleur du texte de la note
  const getNoteColor = (note: number) => {
    if (note >= 15) return "#25cc3d"; 
    if (note >= 10) return "#f4c430"; 
    return "#ff4d4f"; 
  };

  // Fonction pour déterminer la couleur de fond de la note
  const getNoteBackground = (note: number) => {
    if (note >= 15) return alpha("#25cc3d", 0.1);
    if (note >= 10) return alpha("#f4c430", 0.1);
    return alpha("#ff4d4f", 0.1);
  };

  const filteredNotes = notesData.filter((note) => {
    const moduleMatch = moduleFilter === "all" || note.module === moduleFilter;
    let noteMatch = true;
    if (noteFilter === "high") noteMatch = note.note >= 15;
    else if (noteFilter === "medium")
      noteMatch = note.note >= 10 && note.note < 15;
    else if (noteFilter === "low") noteMatch = note.note < 10;
    return moduleMatch && noteMatch;
  });

  // Liste des modules uniques pour le filtre
  const modules = Array.from(new Set(notesData.map((n) => n.module)));

  // Filtrage des notes selon le module et le niveau
  const moyenne =
    notesData.reduce((acc, n) => acc + n.note, 0) / notesData.length;
  const meilleureNote = Math.max(...notesData.map((n) => n.note));
  const notesSupA15 = notesData.filter((n) => n.note >= 15).length;

  const stats = [
    {
      label: "Moyenne générale",
      value: moyenne.toFixed(1),
      icon: <TrendingUpIcon />,
      color: "#D4AF37",
      bg: alpha("#D4AF37", 0.1),
    },
    {
      label: "Meilleure note",
      value: meilleureNote,
      icon: <EmojiEventsIcon />,
      color: "#25cc3d",
      bg: alpha("#25cc3d", 0.1),
    },
    {
      label: "Notes ≥ 15",
      value: `${notesSupA15}/${notesData.length}`,
      icon: <GradeIcon />,
      color: "#2196f3",
      bg: alpha("#2196f3", 0.1),
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #FFF9E5 0%, #FFF3D0 100%)",
        py: 5,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 4,
            }}
          >
            <Box
              sx={{
                background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                borderRadius: 3,
                p: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
              }}
            >
              <SchoolIcon sx={{ color: "#fff", fontSize: 28 }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                fontWeight={900}
                sx={{
                  background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.5px",
                }}
              >
                Mes Notes
              </Typography>
              <Typography variant="body2" sx={{ color: "#666", fontWeight: 500 }}>
                {notesData.length} évaluation{notesData.length > 1 ? "s" : ""} •{" "}
                {modules.length} module{modules.length > 1 ? "s" : ""}
              </Typography>
            </Box>
          </Box>
        </motion.div>

        {/* Stats Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, 1fr)",
            },
            gap: 2,
            mb: 4,
          }}
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  border: "1px solid",
                  borderColor: alpha(stat.color, 0.2),
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    borderColor: stat.color,
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: stat.bg,
                        borderRadius: 2,
                        p: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: stat.color,
                      }}
                    >
                      {stat.icon}
                    </Box>
                  </Box>
                  <Typography
                    variant="h4"
                    fontWeight={900}
                    sx={{ color: stat.color, mb: 0.5 }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </Box>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: 3,
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              border: "1px solid",
              borderColor: alpha("#D4AF37", 0.15),
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FilterListIcon sx={{ color: "#D4AF37" }} />
                <Typography variant="body1" fontWeight={700} sx={{ color: "#333" }}>
                  Filtres
                </Typography>
              </Box>

              <FormControl
                size="small"
                sx={{
                  minWidth: 150,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": {
                      borderColor: "#D4AF37",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#D4AF37",
                    },
                  },
                }}
              >
                <InputLabel>Module</InputLabel>
                <Select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  label="Module"
                >
                  <MenuItem value="all">Tous les modules</MenuItem>
                  {modules.map((mod) => (
                    <MenuItem key={mod} value={mod}>
                      {mod}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{
                  minWidth: 150,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": {
                      borderColor: "#D4AF37",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#D4AF37",
                    },
                  },
                }}
              >
                <InputLabel>Note</InputLabel>
                <Select
                  value={noteFilter}
                  onChange={(e) => setNoteFilter(e.target.value)}
                  label="Note"
                >
                  <MenuItem value="all">Toutes les notes</MenuItem>
                  <MenuItem value="high">Excellentes (≥ 15)</MenuItem>
                  <MenuItem value="medium">Moyennes (10-14)</MenuItem>
                  <MenuItem value="low">À améliorer (&lt; 10)</MenuItem>
                </Select>
              </FormControl>

              {(moduleFilter !== "all" || noteFilter !== "all") && (
                <Chip
                  label="Réinitialiser"
                  onDelete={() => {
                    setModuleFilter("all");
                    setNoteFilter("all");
                  }}
                  sx={{
                    bgcolor: alpha("#D4AF37", 0.1),
                    color: "#C5A028",
                    fontWeight: 600,
                    "&:hover": {
                      bgcolor: alpha("#D4AF37", 0.2),
                    },
                  }}
                />
              )}
            </Box>
          </Paper>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              border: "1px solid",
              borderColor: alpha("#D4AF37", 0.15),
            }}
          >
            <Table>
              <TableHead
                sx={{
                  background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                }}
              >
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 800,
                      color: "#fff",
                      fontSize: "0.95rem",
                    }}
                  >
                    Module
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 800,
                      color: "#fff",
                      fontSize: "0.95rem",
                    }}
                  >
                    Note
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 800,
                      color: "#fff",
                      fontSize: "0.95rem",
                    }}
                  >
                    Date
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredNotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        Aucune note ne correspond aux filtres sélectionnés
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNotes.map(({ id, module, note, date }, idx) => (
                    <motion.tr
                      key={id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      component={TableRow}
                      hover
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: alpha("#D4AF37", 0.05),
                        },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
                        {module}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={note}
                          sx={{
                            bgcolor: getNoteBackground(note),
                            color: getNoteColor(note),
                            fontWeight: 800,
                            fontSize: "0.9rem",
                            borderRadius: 2,
                            minWidth: 50,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: "#666", fontSize: "0.9rem" }}>
                        {date}
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </motion.div>

        {/* Summary */}
        {filteredNotes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <Paper
              elevation={0}
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 3,
                bgcolor: alpha("#D4AF37", 0.05),
                border: "1px solid",
                borderColor: alpha("#D4AF37", 0.2),
              }}
            >
              <Typography variant="body2" sx={{ color: "#666", textAlign: "center" }}>
                Affichage de <strong>{filteredNotes.length}</strong> note
                {filteredNotes.length > 1 ? "s" : ""} sur{" "}
                <strong>{notesData.length}</strong>
              </Typography>
            </Paper>
          </motion.div>
        )}
      </Container>
    </Box>
  );
}