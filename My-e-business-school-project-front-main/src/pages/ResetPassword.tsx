import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  LinearProgress,
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
  blueVirtual: "#3691e0",
  greenPhysical: "#17be72",
};

export default function ResetPassword() {
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const navigate = useNavigate();
  const location = useLocation();

  // Récupérer le token depuis l’URL
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  // Définition des règles de mot de passe
  const rules = useMemo(
    () => [
      { test: (v: string) => v.length >= 8, label: "Au moins 8 caractères" },
      { test: (v: string) => /[A-Z]/.test(v), label: "Une majuscule" },
      { test: (v: string) => /[a-z]/.test(v), label: "Une minuscule" },
      { test: (v: string) => /[0-9]/.test(v), label: "Un chiffre" },
      { test: (v: string) => /[^A-Za-z0-9]/.test(v), label: "Un caractère spécial" },
    ],
    []
  );

  const passedCount = rules.filter(r => r.test(password)).length;
  const unmet = rules.filter(r => !r.test(password)).map(r => r.label);
  const strength = (passedCount / rules.length) * 100;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Lien invalide ou expiré : aucun token détecté.");
      return;
    }

    if (unmet.length > 0) {
      setError("Le mot de passe ne respecte pas toutes les exigences.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        setError("Erreur lors de la réinitialisation. Le lien peut être expiré.");
        setLoading(false);
        return;
      }

      setSuccess("Mot de passe réinitialisé avec succès. Redirection vers la connexion…");
      // Redirection douce après 2,5 s
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      console.error("Erreur réseau :", err);
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
            fontFamily: "Archivo Black, system-ui",
            letterSpacing: 0.2,
          }}
        >
          Nouveau mot de passe
        </Typography>
        <Typography
          variant="body1"
          sx={{ mb: 3, color: "#6b6b6b", fontFamily: "Roboto, system-ui" }}
        >
          Choisissez un mot de passe sécurisé pour votre compte
        </Typography>

        {/* Alertes */}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 2,
              textAlign: "left",
              "& .MuiAlert-message": { fontFamily: "Roboto, system-ui" },
            }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 2,
              borderRadius: 2,
              textAlign: "left",
              "& .MuiAlert-message": { fontFamily: "Roboto, system-ui" },
            }}
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
            disabled={Boolean(success)}
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
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Indicateur de robustesse */}
          <Box sx={{ mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={strength}
              sx={{
                height: 8,
                borderRadius: 999,
                bgcolor: "#eee",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                },
              }}
            />
            <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#777" }}>
              Exigences :
              {" "}
              {unmet.length === 0 ? "Toutes remplies " : unmet.join(" • ")}
            </Typography>
          </Box>

          <TextField
            label="Confirmer le mot de passe"
            type={showConfirmPassword ? "text" : "password"}
            fullWidth
            required
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={Boolean(success)}
            error={confirmPassword.length > 0 && confirmPassword !== password}
            helperText={
              confirmPassword.length > 0 && confirmPassword !== password
                ? "La confirmation ne correspond pas."
                : " "
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: PALETTE.gold }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    aria-label={
                      showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"
                    }
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading || Boolean(success)}
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
              "&:hover": { bgcolor: PALETTE.brown, color: PALETTE.white },
              "&:disabled": { bgcolor: PALETTE.goldSoft, color: "#5a5a5a" },
            }}
          >
            {loading ? "Validation..." : success ? "Réinitialisé ✓" : "Valider"}
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
            fontFamily: "Montserrat, system-ui",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          ← Retour à la connexion
        </Button>

        {/* Bandeau de contexte */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="caption" sx={{ color: "#777" }}>
          Ce lien de réinitialisation est unique et limité dans le temps.
        </Typography>
      </Paper>
    </Box>
  );
}
