import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  InputAdornment,
  Divider,
  Link as MuiLink,
  Alert,
} from "@mui/material";
import { Visibility, VisibilityOff, Lock, Email } from "@mui/icons-material";
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

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: email,
          password: password,
        }),
      });

      if (!response.ok) {
        setError("Identifiants incorrects. Veuillez vérifier votre email et mot de passe.");
        setLoading(false);
        return;
      }

      const data = await response.json();

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("firstName", data.user.firstname);
      localStorage.setItem("lastName", data.user.lastname);

      // Redirection selon le rôle de l'utilisateur
      if (data.user.role === "student") navigate("/etudiant");
      else if (data.user.role === "teacher") navigate("/formateur");
      else if (data.user.role === "admin") navigate("/admin");
      else navigate("/");
    } catch (error) {
      console.error("Erreur réseau :", error);
      setError("Erreur de connexion au serveur. Veuillez réessayer.");
    } finally {
      setLoading(false);  // désactive l'état de chargement
    }
  };

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
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

      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          justifyContent: "center",
          p: 6,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 560,
            borderRadius: 5,
            p: 5,
            background: `${PALETTE.white}AA`,
            backdropFilter: "blur(6px)",
            border: `1px solid #e7e7e7`,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Box
              component="img"
              src={rucheLogo}
              alt="La Ruche Académie"
              sx={{ 
                width: "200px",
                height: "auto",
                objectFit: "contain" 
              }}
            />
          </Box>

          <Typography
            variant="h3"
            sx={{
              fontFamily: 'Archivo Black, system-ui',
              color: PALETTE.brown,
              lineHeight: 1.1,
              mb: 1,
              textAlign: "center",
            }}
          >
            Bienvenue à La Ruche Académie
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ 
              fontFamily: 'Roboto, system-ui', 
              color: "#5a4a2a", 
              mb: 3,
              textAlign: "center"
            }}
          >
            Votre espace de formation — ruche virtuelle & physique.
          </Typography>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3, justifyContent: "center" }}>
            <Box
              component="span"
              sx={{
                px: 1.25,
                py: 0.75,
                borderRadius: 999,
                fontWeight: 700,
                fontFamily: 'Montserrat, system-ui',
                fontSize: 14,
                bgcolor: `${PALETTE.blueVirtual}1a`,
                color: PALETTE.blueVirtual,
                border: `1px solid ${PALETTE.blueVirtual}33`,
              }}
            >
              Ruche virtuelle
            </Box>
            <Box
              component="span"
              sx={{
                px: 1.25,
                py: 0.75,
                borderRadius: 999,
                fontWeight: 700,
                fontFamily: 'Montserrat, system-ui',
                fontSize: 14,
                bgcolor: `${PALETTE.greenPhysical}1a`,
                color: PALETTE.greenPhysical,
                border: `1px solid ${PALETTE.greenPhysical}33`,
              }}
            >
              Ruche physique
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Carte de connexion */}
      <Box sx={{ display: "grid", placeItems: "center", p: { xs: 3, md: 6 } }}>
        <Paper
          elevation={12}
          sx={{
            p: { xs: 4, md: 5 },
            width: "100%",
            maxWidth: 420,
            borderRadius: 5,
            textAlign: "center",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(8px)",
            border: `1px solid #e7e7e7`,
          }}
        >
          {/* Logo mobile */}
          <Box sx={{ display: { xs: "flex", md: "none" }, justifyContent: "center", mb: 3 }}>
            <Box
              component="img"
              src={rucheLogo}
              alt="La Ruche Académie"
              sx={{ width: "120px", height: "auto", objectFit: "contain" }}
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
            Connexion
          </Typography>
          <Typography
            variant="body1"
            sx={{ mb: 3, color: "#6b6b6b", fontFamily: 'Roboto, system-ui' }}
          >
            Accédez à votre espace personnel
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

          {/* Formulaire */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error !== ""}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: PALETTE.gold }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              fullWidth
              required
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error !== ""}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: PALETTE.gold }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
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
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </Box>

          {/* Lien mot de passe oublié */}
          <MuiLink
            component="button"
            type="button"
            onClick={() => navigate("/forgot-password")}
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
            Mot de passe oublié ?
          </MuiLink>

          {/* Bandeau de contexte */}
          <Divider sx={{ my: 3 }} />
          <Typography variant="caption" sx={{ color: "#777" }}>
            En vous connectant, vous acceptez nos conditions d'utilisation.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}