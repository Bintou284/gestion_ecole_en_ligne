import { useState, useEffect } from "react";
import { Chip, alpha } from "@mui/material";
import axios from "axios";

type Status = "pending" | "sent" | "activated";

interface AccountStatusProps {
  profileId: number;
  refreshKey?: number; // Permet de relancer le fetch depuis l'extérieur
}

export function AccountStatus({ profileId, refreshKey }: AccountStatusProps) {
  // État local pour stocker le statut du compte
  const [status, setStatus] = useState<Status>("pending");

  // Appelle l'API pour récupérer le statut du profil donné
  const fetchStatus = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/userstatus/account-status/${profileId}`,
        { withCredentials: true }
      );
      setStatus(res.data.status); // Met à jour le statut
    } catch (err: any) {
      console.error(`[AccountStatus] Erreur API:`, err.response?.data || err.message);
    }
  };

  // Recharge le statut lorsque le profileId change
  // ou lorsqu'une action externe modifie refreshKey
  useEffect(() => {
    fetchStatus();
  }, [profileId, refreshKey]);

  // Style par défaut : statut "pending"
  let color = "#9e9e9e";
  let bgColor = alpha("#9e9e9e", 0.15);
  let message = "En attente";

  // Statut "email envoyé"
  if (status === "sent") {
    color = "#ff9800";
    bgColor = alpha("#ff9800", 0.15);
    message = "Email envoyé";

  // Statut "compte activé"
  } else if (status === "activated") {
    color = "#4caf50";
    bgColor = alpha("#4caf50", 0.15);
    message = "Compte activé";
  }

  // Affichage d'un petit badge stylé selon le statut
  return (
    <Chip
      label={message}
      size="small"
      sx={{
        bgcolor: bgColor,
        color: color,
        fontWeight: 700,
        borderRadius: 2,
        border: "none",
        mt: 0,
      }}
    />
  );
}
