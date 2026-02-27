import React, { useMemo, useState, useEffect } from "react"; 
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
import CategoryIcon from "@mui/icons-material/Category";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationBell from "./NotificationBell";
import ruchelogo from "./images/LaRucheAcadémie.Favicon.png";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import Badge from "@mui/material/Badge";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navMenu: NavItem[] = [
  { to: "/admin/apercu", label: "Aperçu", icon: <DashboardIcon /> },
  { to: "/admin/programmes", label: "Formations", icon: <MenuBookIcon /> },
  { to: "/admin/modules", label: "Modules", icon: <CategoryIcon /> },
  { to: "/admin/enseignants", label: "Enseignants", icon: <PersonIcon /> },
  { to: "/admin/profils-etudiants", label: "Étudiants", icon: <GroupsIcon /> },
  { to: "/admin/planning", label: "Planning", icon: <CalendarMonthIcon /> },
];

export default function AdminNavbar() {
  const navigate = useNavigate();

  const [navAnchor, setNavAnchor] = useState<null | HTMLElement>(null);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  const openNav = Boolean(navAnchor);
  const openProfile = Boolean(profileAnchor);

  // Gestion du nom / initiales / rôle
  const { displayName, initial, role } = useMemo(() => {
    const userRaw = localStorage.getItem("user");
    let full = "";
    let userRole = "Admin";

    if (userRaw) {
      try {
        const u = JSON.parse(userRaw);
        const fn = u.firstname ?? u.firstName ?? "";
        const ln = u.lastname ?? u.lastName ?? "";
        if (fn || ln) {
          full = `${fn} ${ln}`.trim();
        }
        if (u.role) userRole = u.role;
      } catch (e) {
        console.error("Erreur parse user localStorage", e);
      }
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

    return { displayName: full, initial: ini, role: userRole };
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


  const [pendingCount, setPendingCount] = useState<number>(0);

  const API_BASE =
    (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") ||
    (import.meta as any).env?.VITE_BACKEND_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  const token = localStorage.getItem("token") || "";

  async function fetchPendingCount() {
    try {
      const r = await fetch(`${API_BASE}/api/courses/resources`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error();
      const arr = await r.json();
      setPendingCount(Array.isArray(arr) ? arr.length : 0);
    } catch {
      setPendingCount(0);
    }
  }

  useEffect(() => {
    fetchPendingCount();
    const id = setInterval(fetchPendingCount, 30000); 
    return () => clearInterval(id);
  }, []);

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
        {/* Logo + Nom */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar src={ruchelogo} alt="ruche" sx={{ width: 50, height: 50, bgcolor: "transparent" }} />
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1 }}>
              La Ruche Académie
            </Typography>
            <Typography variant="caption" sx={{ color: "#b38b00" }}>
              Espace Admin
            </Typography>
          </Box>
        </Stack>

        {/* Menu centré (desktop) */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            gap: 2,
            flexGrow: 1,
            justifyContent: "center",
          }}
        >
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

        {/* Côté droit */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Hamburger visible en mobile */}
          <IconButton
            sx={{ display: { xs: "inline-flex", md: "none" } }}
            onClick={handleOpenNav}
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>

          {/* Notifications */}
          <NotificationBell />

          <IconButton
            aria-label="Ressources à valider"
            onClick={() => navigate("/admin/validations/ressources")}
            sx={{
              mx: 0.5,
              borderRadius: 2,
              "&:hover": { backgroundColor: "#fffbe6" },
            }}
          >
            <Badge
              badgeContent={pendingCount > 99 ? "99+" : pendingCount}
              color="error"
              overlap="circular"
            >
              <PendingActionsIcon sx={{ color: "#b38b00" }} />
            </Badge>
          </IconButton>

          {/* Nom + rôle*/}
          <Stack
            sx={{
              textAlign: "right",
              mr: { xs: 0, md: 1 },
              display: { xs: "none", lg: "block" },
              maxWidth: 160,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: "#0f172a",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {displayName || "Admin"}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {role || "Admin"}
            </Typography>
          </Stack>

          {/* Profil */}
          <IconButton onClick={handleOpenProfile} size="small">
            <Avatar sx={{ background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)" }}>
              {initial || "A"}
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
