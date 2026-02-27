import { useState } from "react";
import {
  Container, Box, Typography, Card, CardContent, Grid, Button,
  Select, MenuItem, Stack, Avatar, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton
} from "@mui/material";
import GradeIcon from "@mui/icons-material/Grade";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CloseIcon from "@mui/icons-material/Close";
import { motion } from "framer-motion";

const courses = [
  { id: 1, name: "Introduction aux Composants React – 15/03/2024" },
  { id: 2, name: "Algorithmique – 22/03/2024" }
];

const apprenants = [
  { id: 1, name: "Marie Dubois" },
  { id: 2, name: "Thomas Leroy" }
];

export default function Notes() {
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0].id);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedApprenant, setSelectedApprenant] = useState("");
  const [note, setNote] = useState(0);
  const [outOf, setOutOf] = useState(20);
  const [commentaire, setCommentaire] = useState("");
  const [editId, setEditId] = useState(null);

  const [notesData, setNotesData] = useState([
    {
      id: 1,
      courseId: 1,
      name: "Marie Dubois",
      avatar: <Avatar sx={{ bgcolor: "#ffe082", color: "#b38b00" }}><EmojiEventsIcon /></Avatar>,
      moyenne: "18.0/20",
      grade: 18,
      gradeColor: "#46b96e",
      comment: "Compréhension et exercices bien faits."
    },
    {
      id: 2,
      courseId: 1,
      name: "Thomas Leroy",
      avatar: <Avatar sx={{ bgcolor: "#ffe082", color: "#b38b00" }}><EmojiEventsIcon /></Avatar>,
      moyenne: "15.0/20",
      grade: 15,
      gradeColor: "#FDBA48",
      comment: "Doit travailler la syntaxe JSX."
    }
  ]);

  const filteredNotes = notesData.filter(n => n.courseId === selectedCourseId);

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedApprenant("");
    setNote(0);
    setOutOf(20);
    setCommentaire("");
    setEditId(null);
  };

  const handleSave = () => {
    if (!selectedApprenant) return alert("Veuillez sélectionner un apprenant");
    if (note < 0 || note > outOf) return alert("Note invalide");

    const gradeColor = note >= outOf * 0.8 ? "#46b96e" : "#FDBA48";
    const moyenne = `${note}/${outOf}`;

    if (editId) {
      setNotesData(prev => prev.map(n =>
        n.id === editId ? { ...n, name: selectedApprenant, grade: note, gradeColor, moyenne, comment: commentaire, courseId: selectedCourseId } : n
      ));
    } else {
      setNotesData(prev => [
        ...prev,
        {
          id: Date.now(),
          name: selectedApprenant,
          avatar: <Avatar sx={{ bgcolor: "#ffe082", color: "#b38b00" }}><EmojiEventsIcon /></Avatar>,
          grade: note,
          gradeColor,
          moyenne,
          comment: commentaire,
          courseId: selectedCourseId
        }
      ]);
    }
    handleCloseDialog();
  };

  const handleEditNote = (id) => {
    const note = notesData.find(n => n.id === id);
    if (note) {
      setSelectedApprenant(note.name);
      setNote(note.grade);
      setOutOf(20);
      setCommentaire(note.comment);
      setEditId(id);
      setSelectedCourseId(note.courseId);
      setOpenDialog(true);
    }
  };

  const handleDeleteNote = (id) => {
    if (window.confirm("Supprimer cette note ?")) {
      setNotesData(prev => prev.filter(n => n.id !== id));
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fffdf2", py: 5 }}>
      <Container maxWidth="md">
        {/* Header */}
        <Card sx={{ mb: 4, borderRadius: 4, bgcolor: "#fffde7" }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" alignItems="center" spacing={1}>
                <GradeIcon color="warning" />
                <Typography fontWeight={700}>Gestion des Notes</Typography>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Select
                  size="small"
                  value={selectedCourseId}
                  onChange={e => setSelectedCourseId(Number(e.target.value))}
                  sx={{ bgcolor: "#fffdf2", fontWeight: 600, minWidth: 300 }}
                >
                  {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
                <Button variant="contained" color="warning" onClick={handleOpenDialog} sx={{ fontWeight: 700, borderRadius: 2 }}>
                  + Ajouter une note
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Notes List */}
        <Grid container spacing={3}>
          {filteredNotes.map(n => (
              <motion.div
                whileHover={{ y: -5, boxShadow: "0 8px 20px rgba(0,0,0,0.12)" }}
                transition={{ duration: 0.3 }}
              >
                <Card sx={{ borderRadius: 4, p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                  <Box>{n.avatar}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={700}>{n.name}</Typography>
                    <Typography variant="body2" color="#848484" fontWeight={700}>Moyenne module: {n.moyenne}</Typography>
                    <Box sx={{ bgcolor: "#f8fafc", borderRadius: 2, p: 1, mt: 1, fontSize: 14, color: "#2450a8" }}>
                      {n.comment}
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: "center", minWidth: 70 }}>
                    <Typography fontWeight={700} sx={{ color: n.gradeColor, fontSize: 22 }}>{n.grade}/20</Typography>
                    <Button size="small" sx={{ minWidth: 24, p: 0, color: "#f0ad4e" }} onClick={() => handleEditNote(n.id)}>Modifier</Button>
                    <Button size="small" sx={{ minWidth: 24, p: 0, color: "#e85c5c" }} onClick={() => handleDeleteNote(n.id)}>Supprimer</Button>
                  </Box>
                </Card>
              </motion.div>
          ))}
        </Grid>

        {/* Dialog Ajouter / Modifier */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
          <DialogTitle>
            {editId ? "Modifier une note" : "Ajouter une note"}
            <IconButton aria-label="close" onClick={handleCloseDialog} sx={{ position: "absolute", right: 10, top: 10 }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <Select value={selectedApprenant} onChange={e => setSelectedApprenant(e.target.value)} fullWidth displayEmpty>
                <MenuItem value="">Sélectionner un apprenant</MenuItem>
                {apprenants.map(a => <MenuItem key={a.id} value={a.name}>{a.name}</MenuItem>)}
              </Select>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField label="Note" type="number" value={note} onChange={e => setNote(parseInt(e.target.value, 10) || 0)} fullWidth inputProps={{ min: 0 }} />
                <TextField label="Sur" type="number" value={outOf} onChange={e => setOutOf(parseInt(e.target.value, 10) || 20)} fullWidth inputProps={{ min: 1 }} />
              </Box>
              <TextField label="Commentaire du formateur" multiline minRows={4} value={commentaire} onChange={e => setCommentaire(e.target.value)} fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="outlined" onClick={handleCloseDialog} sx={{ borderRadius: 2, fontWeight: 700 }}>Annuler</Button>
            <Button variant="contained" color="warning" onClick={handleSave} sx={{ fontWeight: 700, borderRadius: 2 }}>Enregistrer</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}