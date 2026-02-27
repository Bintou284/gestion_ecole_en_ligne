import  { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  Divider,
  Alert,
} from "@mui/material";
import { Email } from "@mui/icons-material";
import rucheLogo from "../assets/ruche.png";

const PALETTE = {
  white: "#ffffff",
  gold: "#d19d33",
  goldAccent: "#ecb024",
  goldSoft: "#be956d",
  brown: "#763e00",
  gray900: "#212121",
  blueVirtual: "#3691e0",
  greenPhysical: "#17be72",
};

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setError("Impossible d'envoyer le lien de réinitialisation. Vérifiez votre email.");
        setLoading(false);
        return;
      }

      setSuccess("Un lien de réinitialisation a été envoyé à votre adresse email.");
      
      // Redirection après 3 secondes
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Erreur réseau :", error);
      setError("Erreur de connexion au serveur. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${PALETTE.white} 0%, #fff6e3 45%, #fff0c7 100%)`,
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: -200,
          background: `radial-gradient(600px 600px at 10% 10%, ${PALETTE.goldAccent}22 0, transparent 60%),
                       radial-gradient(700px 700px at 90% 90%, ${PALETTE.gold}22 0, transparent 65%)`,
          filter: "blur(6px)",
          pointerEvents: "none",
        }}
      />

      {/* Carte principale */}
      <Paper
        elevation={12}
        sx={{
          p: { xs: 4, md: 5 },
          width: "100%",
          maxWidth: 440,
          borderRadius: 5,
          textAlign: "center",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(8px)",
          border: `1px solid #e7e7e7`,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <Box
            component="img"
            src={rucheLogo}
            alt="La Ruche Académie"
            sx={{ width: "100px", height: "auto", objectFit: "contain" }}
          />
        </Box>

        {/* Titre */}
        <Typography
          variant="h4"
          sx={{
            mb: 0.5,
            fontWeight: 800,
            color: PALETTE.gold,
            fontFamily: 'Archivo Black, system-ui',
            letterSpacing: 0.2,
          }}
        >
          Mot de passe oublié ?
        </Typography>
        <Typography
          variant="body1"
          sx={{ mb: 3, color: "#6b6b6b", fontFamily: 'Roboto, system-ui' }}
        >
          Entrez votre email pour recevoir un lien de réinitialisation
        </Typography>

        {/* Message d'erreur */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2, 
              borderRadius: 2,
              textAlign: "left",
              '& .MuiAlert-message': {
                fontFamily: 'Roboto, system-ui',
              }
            }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {/* Message de succès */}
        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2, 
              borderRadius: 2,
              textAlign: "left",
              '& .MuiAlert-message': {
                fontFamily: 'Roboto, system-ui',
              }
            }}
          >
            {success}
          </Alert>
        )}

        {/* Formulaire */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Votre email"
            type="email"
            fullWidth
            required
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error !== ""}
            disabled={success !== ""}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: PALETTE.gold }} />
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading || success !== ""}
            sx={{
              mt: 3,
              borderRadius: 3,
              py: 1.5,
              fontWeight: 800,
              textTransform: "none",
              fontSize: "1rem",
              bgcolor: PALETTE.gold,
              color: "#1a1a1a",
              boxShadow: "0 6px 18px rgba(209,157,51,.28)",
              '&:hover': { bgcolor: PALETTE.brown, color: PALETTE.white },
              '&:disabled': { bgcolor: PALETTE.goldSoft, color: "#5a5a5a" },
            }}
          >
            {loading ? "Envoi en cours..." : success ? "Email envoyé !" : "Envoyer le lien"}
          </Button>
        </Box>

        {/* Retour connexion */}
        <Button
          onClick={() => navigate("/login")}
          sx={{
            mt: 2.25,
            textTransform: "none",
            color: PALETTE.brown,
            fontSize: "0.95rem",
            fontWeight: 600,
            fontFamily: 'Montserrat, system-ui',
            '&:hover': { textDecoration: "underline" },
          }}
        >
          ← Retour à la connexion
        </Button>

        {/* Bandeau de contexte */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="caption" sx={{ color: "#777" }}>
          Vous recevrez un email avec un lien pour réinitialiser votre mot de passe.
        </Typography>
      </Paper>
    </Box>
  );
}