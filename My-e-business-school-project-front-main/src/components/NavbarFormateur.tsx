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
import DashboardIcon from "@mui/icons-material/Dashboard";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import GradeIcon from "@mui/icons-material/Grade";
import GroupsIcon from "@mui/icons-material/Groups";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationBell from "./NotificationBell";
import ruchelogo from "./images/LaRucheAcadémie.Favicon.png";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navMenu: NavItem[] = [
  { to: "/formateur/apercu", label: "Aperçu", icon: <DashboardIcon /> },
  { to: "/formateur/cours", label: "Mes Cours", icon: <MenuBookIcon /> },
  { to: "/formateur/notes", label: "Notes", icon: <GradeIcon /> },
  { to: "/formateur/apprenants", label: "Apprenants", icon: <GroupsIcon /> },
  { to: "/formateur/planning", label: "Planning", icon: <CalendarMonthIcon /> },
];

export default function NavbarFormateur() {
  const navigate = useNavigate();

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

  const handleOpenProfile = (e: React.MouseEvent<HTMLElement>) => setProfileAnchor(e.currentTarget);
  const handleCloseProfile = () => setProfileAnchor(null);

  const handleOpenNav = (e: React.MouseEvent<HTMLElement>) => setNavAnchor(e.currentTarget);
  const handleCloseNav = () => setNavAnchor(null);

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
              Espace Formateur
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
          {navMenu.map((item) => (
            <Button
              key={item.to}
              startIcon={item.icon}
              component={NavLink}
              to={item.to}
              end
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

        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton
            sx={{ display: { xs: "inline-flex", md: "none" } }}
            onClick={handleOpenNav}
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>

          {/* Notifications */}
          <NotificationBell />

          {/* Profil */}
          <Stack sx={{ textAlign: "right", mr: { xs: 0, md: 1 } }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
              {displayName || "Formateur"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#6b7280" }}>
              Formateur
            </Typography>
          </Stack>

          <IconButton onClick={handleOpenProfile} size="small" aria-label="menu utilisateur">
            <Avatar sx={{ background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)" }}>
              {initial || "F"}
            </Avatar>
          </IconButton>
        </Stack>
      </Toolbar>

      {/* Menu nav (mobile) — même logique que l’admin */}
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
