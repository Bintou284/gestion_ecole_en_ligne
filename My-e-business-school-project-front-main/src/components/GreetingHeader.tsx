import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

interface GreetingHeaderProps {
  firstName?: string;
  role?: string;
}

const roleColors = {
  student: {
    gradient: "linear-gradient(135deg, #f4c430 0%, #b38b00 100%)",
    shadow: "rgba(244, 196, 48, 0.3)",
    textShadow: "rgba(179, 139, 0, 0.3)",
  },
  teacher: {
    gradient: "linear-gradient(135deg, #f59e0b 0%, #b38b00 100%)",
    shadow: "rgba(245, 158, 11, 0.3)",
    textShadow: "rgba(179, 139, 0, 0.3)",
  },
  admin: {
    gradient: "linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)",
    shadow: "rgba(123, 31, 162, 0.3)",
    textShadow: "rgba(106, 27, 154, 0.3)",
  },
};

const GreetingHeader: React.FC<GreetingHeaderProps> = ({ firstName, role }) => {
  const [displayName, setDisplayName] = useState(firstName || "");
  const [userRole, setUserRole] = useState(role || "student");

  useEffect(() => {
    // Récupérer le prénom depuis localStorage si non fourni
    if (!firstName) {
      const storedFirstName = localStorage.getItem("firstName");
      if (storedFirstName) {
        setDisplayName(storedFirstName);
      }
    } else {
      setDisplayName(firstName);
    }

    // Récupérer le rôle depuis localStorage si non fourni
    if (!role) {
      const storedRole = localStorage.getItem("role");
      if (storedRole) {
        setUserRole(storedRole);
      }
    } else {
      setUserRole(role);
    }
  }, [firstName, role]);

  // Déterminer les couleurs en fonction du rôle
  const colors = roleColors[userRole as keyof typeof roleColors] || roleColors.student;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      sx={{
        p: 4,
        mb: 3,
        background: colors.gradient,
        borderRadius: 3,
        boxShadow: `0 4px 12px ${colors.shadow}`,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)",
          pointerEvents: "none",
        },
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontFamily: "Archivo Black",
          color: "#ffffff",
          textShadow: `2px 2px 4px ${colors.textShadow}`,
          position: "relative",
          zIndex: 1,
        }}
      >
        Bonjour, {displayName || "Utilisateur"} !
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontFamily: "Montserrat",
          color: "#ffffff",
          mt: 0.5,
          opacity: 0.95,
          position: "relative",
          zIndex: 1,
        }}
      >
        Bienvenue sur votre espace
      </Typography>
    </Box>
  );
};

export default GreetingHeader;
