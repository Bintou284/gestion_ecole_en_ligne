// src/components/Mainnavbar.tsx
import React, { useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Avatar,
  Stack,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { NavLink, useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SchoolIcon from "@mui/icons-material/School";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import MenuIcon from "@mui/icons-material/Menu";

import ruchelogo from "./images/LaRucheAcadémie.Favicon.png";
import NotificationBell from "./NotificationBell";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navMenu: NavItem[] = [
  { to: "/etudiant/accueil", label: "Accueil", icon: <HomeIcon /> },
  { to: "/etudiant/calendrier", label: "Calendrier", icon: <CalendarMonthIcon /> },
  { to: "/etudiant/modules", label: "Modules", icon: <SchoolIcon /> },
  { to: "/etudiant/notes", label: "Notes", icon: <EmojiObjectsIcon /> },
];

export default function Mainnavbar() {
  const navigate = useNavigate();

  // Menus
  const [navAnchor, setNavAnchor] = useState<null | HTMLElement>(null);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  const openNav = Boolean(navAnchor);
  const openProfile = Boolean(profileAnchor);

  const { displayName, initial } = useMemo(() => {
    const userRaw = localStorage.getItem("user");
    let full = "";
    if (userRaw) {
      try {
        const u = JSON.parse(userRaw);
        if (u?.firstname || u?.lastname) {
          full = `${u.firstname ?? ""} ${u.lastname ?? ""}`.trim();
        }
      } catch {}
    }
    if (!full) {
      const fn = localStorage.getItem("firstName") || "";
      const ln = localStorage.getItem("lastName") || "";
      full = `${fn} ${ln}`.trim();
    }
    const ini = full
      ? full
          .split(" ")
          .filter(Boolean)
          .map((p: string) => p[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "";
    return { displayName: full, initial: ini };
  }, []);

  const handleOpenNav = (e: React.MouseEvent<HTMLElement>) => setNavAnchor(e.currentTarget);
  const handleCloseNav = () => setNavAnchor(null);

  const handleOpenProfile = (e: React.MouseEvent<HTMLElement>) => setProfileAnchor(e.currentTarget);
  const handleCloseProfile = () => setProfileAnchor(null);

  const handleProfileClick = () => {
    handleCloseProfile();
    navigate('/profile');
  };

  const handleLogout = () => {
    handleCloseProfile();
    localStorage.clear();
    navigate("/login");
  };

  return (
    <AppBar
      position="static"
      elevation={1}
      sx={{
        bgcolor: "#fff",
        color: "#b38b00",
        borderBottom: "2px solid #f6e8c3",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", minHeight: 72 }}>
        {/* Logo + titre */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar src={ruchelogo} alt="ruche" sx={{ width: 50, height: 50, bgcolor: "transparent" }} />
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1 }}>
              La Ruche Académie
            </Typography>
            <Typography variant="caption" sx={{ color: "#b38b00" }}>
              Espace Étudiant
            </Typography>
          </Box>
        </Stack>

        {/* Menu centré (desktop) */}
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
          {navMenu.map((item) => (
            <Button
              key={item.to}
              startIcon={item.icon}
              component={NavLink}
              to={item.to}
              sx={{
                flexDirection: "column",
                minWidth: 72,
                color: "#b38b00",
                fontWeight: 600,
                fontSize: "0.8rem",
                borderRadius: 2,
                backgroundColor: "transparent",
                "&.active": {
                  color: "#f4c430",
                  borderBottom: "3px solid #f4c430",
                  backgroundColor: "#fffbe0",
                },
                "&:hover": {
                  color: "#f4c430",
                  backgroundColor: "#fffde7",
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        {/* Droite : hamburger (mobile) + cloche + profil */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton sx={{ display: { xs: "inline-flex", md: "none" } }} onClick={handleOpenNav} aria-label="menu">
            <MenuIcon />
          </IconButton>

          <NotificationBell />

          <Stack sx={{ textAlign: "right", mr: { xs: 0, md: 1 } }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
              {displayName || "Étudiant"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#6b7280" }}>
              Étudiant
            </Typography>
          </Stack>

          <IconButton onClick={handleOpenProfile} size="small" aria-label="menu utilisateur">
            <Avatar sx={{ background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)" }}>
              {initial || "E"}
            </Avatar>
          </IconButton>
        </Stack>
      </Toolbar>

      {/* Menu nav (mobile) */}
      <Menu
        anchorEl={navAnchor}
        open={openNav}
        onClose={handleCloseNav}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {navMenu.map((item) => (
          <MenuItem
            key={item.to}
            onClick={() => {
              handleCloseNav();
              navigate(item.to);
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {item.icon}
              <Typography>{item.label}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* Menu profil */}
      <Menu
        anchorEl={profileAnchor}
        open={openProfile}
        onClose={handleCloseProfile}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: "#fff",
            color: "#212121",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            "& .MuiMenuItem-root:hover": { bgcolor: "#f5f5f5" },
          },
        }}
      >
        <MenuItem onClick={handleProfileClick}>Profil</MenuItem>
        <MenuItem onClick={handleCloseProfile}>Paramètres</MenuItem>
        <MenuItem onClick={handleLogout}>Déconnexion</MenuItem>
      </Menu>
    </AppBar>
  );
}
