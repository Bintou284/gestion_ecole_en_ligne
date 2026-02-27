import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  InputAdornment,
  Divider,
  Alert,
} from "@mui/material";
import { Visibility, VisibilityOff, Lock } from "@mui/icons-material";
import rucheLogo from "../assets/ruche.png";

const PALETTE = {
  white: "#ffffff",
  gold: "#d19d33",
  goldAccent: "#ecb024",
  goldSoft: "#be956d",
  brown: "#763e00",
  gray900: "#212121",
};

export default function ActivateAccount() {
  // États pour gérer le mot de passe et sa confirmation
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  // États pour afficher ou masquer les mots de passe
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  // État pour gérer le chargement lors de l'envoi
  const [loading, setLoading] = useState(false);

  // Gestion des messages d’état
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Pour naviguer vers une autre page après activation
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // Fonction appelée à l'envoi du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError("Lien d’activation invalide !");
      return;
    }

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas !");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/active/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors de l’activation du compte");
        return;
      }

      setSuccess("Compte activé avec succès ! Vous pouvez maintenant vous connecter.");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      console.error("Erreur réseau :", err);
      setError("Erreur de connexion au serveur !");
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
      {/* Décorations de fond */}
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
          border: "1px solid #e7e7e7",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <Box component="img" src={rucheLogo} alt="La Ruche Académie" sx={{ width: 100 }} />
        </Box>

        {/* Titre */}
        <Typography
          variant="h4"
          sx={{
            mb: 0.5,
            fontWeight: 800,
            color: PALETTE.gold,
            fontFamily: "Archivo Black, system-ui",
            letterSpacing: 0.2,
          }}
        >
          Activation du compte
        </Typography>
        <Typography
          variant="body1"
          sx={{ mb: 3, color: "#6b6b6b", fontFamily: "Roboto, system-ui" }}
        >
          Choisissez un mot de passe pour activer votre compte
        </Typography>

        {/* Messages */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: 2, textAlign: "left" }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2, borderRadius: 2, textAlign: "left" }}
          >
            {success}
          </Alert>
        )}

        {/* Formulaire */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Nouveau mot de passe"
            type={showPassword ? "text" : "password"}
            fullWidth
            required
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!!success}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: PALETTE.gold }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Confirmez le mot de passe"
            type={showConfirm ? "text" : "password"}
            fullWidth
            required
            margin="normal"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={!!success}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: PALETTE.gold }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirm(!showConfirm)}
                    edge="end"
                    aria-label={
                      showConfirm
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading || !!success}
            sx={{
              mt: 3,
              borderRadius: 3,
              py: 1.5,
              fontWeight: 800,
              textTransform: "none",
              fontSize: "1rem",
              background: `linear-gradient(135deg, ${PALETTE.gold} 0%, ${PALETTE.goldAccent} 100%)`,
              color: "#1a1a1a",
              boxShadow: "0 6px 18px rgba(209,157,51,.28)",
              "&:hover": {
                background: `linear-gradient(135deg, ${PALETTE.goldAccent} 0%, ${PALETTE.brown} 100%)`,
                color: PALETTE.white,
              },
              "&:disabled": { bgcolor: PALETTE.goldSoft, color: "#5a5a5a" },
            }}
          >
            {loading
              ? "Activation en cours..."
              : success
              ? "Compte activé !"
              : "Activer le compte"}
          </Button>
        </Box>

        <Button
          onClick={() => navigate("/login")}
          sx={{
            mt: 2.25,
            textTransform: "none",
            color: PALETTE.brown,
            fontSize: ".95rem",
            fontWeight: 600,
            fontFamily: "Montserrat, system-ui",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          ← Retour à la connexion
        </Button>

        <Divider sx={{ my: 3 }} />
        <Typography variant="caption" sx={{ color: "#777" }}>
          Votre mot de passe doit contenir au moins 8 caractères.
        </Typography>
      </Paper>
    </Box>
  );
}
