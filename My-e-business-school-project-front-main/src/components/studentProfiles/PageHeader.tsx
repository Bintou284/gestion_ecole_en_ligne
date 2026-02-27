import { Box, Typography, Button, Stack, alpha } from "@mui/material";
import { motion } from "framer-motion";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  buttonLabel: string;
  onButtonClick: () => void;
}

/**
 * Composant d’en-tête de page réutilisable :
 * - affiche un titre + sous-titre
 * - inclut un bouton d’action
 * - utilise une animation d’apparition (Framer Motion)
 */
export default function PageHeader({ title, subtitle, buttonLabel, onButtonClick }: PageHeaderProps) {
  return (
    // Animation d'entrée (fade + léger slide vers le haut)
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Conteneur principal stylisé */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #fff 0%, #fffef8 100%)",
          borderRadius: 5,
          p: { xs: 3, md: 5 },
          mb: 5,
          boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
          border: "1px solid",
          borderColor: alpha("#D4AF37", 0.2), // Bordure dorée légère
        }}
      >
        {/* Mise en page : texte à gauche, bouton à droite */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems="center"
          justifyContent="space-between"
          spacing={3}
        >
          {/* Bloc Titre + Sous-titre */}
          <Box>
            <Typography
              variant="h3"
              fontWeight={900}
              sx={{
                // Dégradé doré appliqué au texte
                background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 1,
                letterSpacing: "-0.5px",
              }}
            >
              {title}
            </Typography>

            <Typography sx={{ color: "#666", fontWeight: 500 }}>
              {subtitle}
            </Typography>
          </Box>

          {/* Bouton d'action principal */}
          <Button
            startIcon={<AddCircleOutlineIcon />}
            variant="contained"
            onClick={onButtonClick}
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
            {buttonLabel}
          </Button>
        </Stack>
      </Box>
    </motion.div>
  );
}
