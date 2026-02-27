import { Card, Stack, Typography, Chip, IconButton, Button, alpha, Box } from "@mui/material";
import { motion } from "framer-motion";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SchoolIcon from "@mui/icons-material/School";
import { AccountStatus } from "./AccountStatus";
import axios from "axios";
import type { ProfilEtudiant } from "../../types/student";

interface StudentProfileCardProps {
  profil: ProfilEtudiant;
  index: number;
  onEdit: (profil: ProfilEtudiant) => void;
  onDelete: (profileId: number) => void;
  onOpenDocuments: (profileId: number, studentName: string) => void;
  onShowSnackbar: (message: string, severity: "success" | "error") => void;
  onRefreshActivation: (profileId: number) => void; 
  refreshKey: number;   
}

export default function StudentProfileCard({
  profil,
  index,
  onEdit,
  onDelete,
  onOpenDocuments,
  onShowSnackbar,
  onRefreshActivation,
  refreshKey,
}: StudentProfileCardProps) {
  
  const handleSendActivation = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/email/sendActivation/${profil.profile_id}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      onRefreshActivation(profil.profile_id); 
      onShowSnackbar(`Email d'activation envoyé à ${profil.first_name} ${profil.last_name}`, "success");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de l'envoi de l'email d'activation";
      onShowSnackbar(errorMessage, "error");
    }
  };

  const handleSendInscription = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/email/send_inscription_email/${profil.profile_id}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      onShowSnackbar(`Email d'inscription envoyé à ${profil.first_name} ${profil.last_name}`, "success");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de l'envoi de l'email d'activation";
      onShowSnackbar(errorMessage, "error");    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -6 }}
    >
      <Card
        sx={{
          borderRadius: 4,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          bgcolor: "#fff",
          transition: "all 0.3s ease",
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
            background: "linear-gradient(90deg, #D4AF37 0%, #C5A028 100%)",
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flex: 1 }}>
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
                <PersonIcon sx={{ color: "#D4AF37" }} />
              </Box>

              <Box flex={1}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                  {profil.first_name} {profil.last_name}
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                  {profil.email && (
                    <Chip
                      icon={<EmailIcon />}
                      label={profil.email}
                      size="small"
                      sx={{
                        bgcolor: alpha("#2196f3", 0.15),
                        color: "#0d47a1",
                        fontWeight: 600,
                        borderRadius: 2,
                        border: 'none'
                      }}
                    />
                  )}
                  {profil.phone && (
                    <Chip
                      icon={<PhoneIcon />}
                      label={profil.phone}
                      size="small"
                      sx={{
                        bgcolor: alpha("#9c27b0", 0.15),
                        color: "#6a1b9a",
                        fontWeight: 600,
                        borderRadius: 2,
                        border: 'none'
                      }}
                    />
                  )}
                  {profil.city && (
                    <Chip
                      icon={<LocationOnIcon />}
                      label={profil.city}
                      size="small"
                      sx={{
                        bgcolor: alpha("#f44336", 0.15),
                        color: "#c62828",
                        fontWeight: 600,
                        borderRadius: 2,
                        border: 'none'
                      }}
                    />
                  )}
                  {profil.desired_program && (
                    <Chip
                      icon={<SchoolIcon />}
                      label={profil.desired_program}
                      size="small"
                      sx={{
                        bgcolor: alpha("#D4AF37", 0.15),
                        color: "#C5A028",
                        fontWeight: 700,
                        borderRadius: 2,
                        border: 'none'
                      }}
                    />
                  )}
                </Stack>

                <Box display="flex" flexWrap="wrap" gap={3} sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: "#666", fontWeight: 600 }}>
                      Situation
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#333", fontWeight: 500 }}>
                      {profil.situation || "Non renseigné"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: "#666", fontWeight: 600 }}>
                      Niveau d'études
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#333", fontWeight: 500 }}>
                      {profil.highest_degree || "Non renseigné"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: "#666", fontWeight: 600 }}>
                      Zone de mobilité
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#333", fontWeight: 500 }}>
                      {profil.mobility_zone || "Non renseigné"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: "#666", fontWeight: 600 }}>
                      Financement
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#333", fontWeight: 500 }}>
                      {profil.financing_preference || "Non renseigné"}
                    </Typography>
                  </Box>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    label={profil.found_apprenticeship ? "Alternance trouvée" : "Alternance recherchée"}
                    size="small"
                    sx={{
                      bgcolor: profil.found_apprenticeship
                        ? alpha("#4caf50", 0.15)
                        : alpha("#ff9800", 0.15),
                      color: profil.found_apprenticeship ? "#2e7d32" : "#e65100",
                      fontWeight: 700,
                      borderRadius: 2,
                      border: 'none'
                    }}
                  />

                  <AccountStatus profileId={profil.profile_id} refreshKey={refreshKey} />
                </Stack>
              </Box>
            </Box>

            <Stack spacing={1} alignItems="center">
              <IconButton
                onClick={() => onEdit(profil)}
                sx={{
                  color: '#D4AF37',
                  '&:hover': { bgcolor: alpha("#D4AF37", 0.1) }
                }}
                title="Modifier"
              >
                <EditIcon />
              </IconButton>

              <IconButton
                onClick={() => onDelete(profil.profile_id)}
                sx={{
                  color: '#f44336',
                  '&:hover': { bgcolor: alpha("#f44336", 0.1) }
                }}
                title="Supprimer"
              >
                <DeleteIcon />
              </IconButton>

              <Button
                variant="outlined"
                size="small"
                startIcon={<DescriptionIcon />}
                onClick={() => onOpenDocuments(profil.profile_id, `${profil.first_name} ${profil.last_name}`)}
                sx={{
                  borderColor: "#D4AF37",
                  color: "#D4AF37",
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: "#C5A028",
                    bgcolor: alpha("#D4AF37", 0.05),
                  }
                }}
              >
                Documents
              </Button>
            </Stack>
          </Box>

          <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: "center" }}>
            <Button
              variant="contained"
              onClick={handleSendInscription}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                textTransform: "none",
                background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                color: "#fff",
                "&:hover": {
                  bgcolor: "#C5A028"
                },
              }}
            >
              Envoyer inscription
            </Button>

            <Button
              variant="contained"
              onClick={handleSendActivation}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                textTransform: "none",
                bgcolor: alpha("#D4AF37", 0.15),
                color: "#C5A028",
                "&:hover": {
                  bgcolor: alpha("#D4AF37", 0.15),
                  color: "#C5A028",
                },
              }}
            >
              Envoyer activation
            </Button>
          </Stack>
        </Box>
      </Card>
    </motion.div>
  );
}