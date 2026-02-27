import React, { useEffect, useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Button,
  Stack,
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
  redirectLink: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId || !token) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          setNotifications(data);
        } catch (err) {
          console.error('Erreur de parsing JSON:', err);
        }
      } catch (error) {
        console.error('Erreur fetch notifications:', error);
      }
    };
    fetchNotifications();
  }, [userId, token]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter((n) => !n.read);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleFilter = (f: 'all' | 'unread') => setFilter(f);

  // Marquer une notification comme lue + REDIRECTION
  const handleNotifClick = async (notif: Notification) => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications/${notif.id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      if (notif.redirectLink) {
        navigate(notif.redirectLink); // Redirection interne SPA
      }
      handleClose();
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} size="large">
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsNoneIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            p: 0,
            maxWidth: 360,
            minWidth: 320,
            maxHeight: 460,
            overflowY: 'auto',
            borderRadius: 3,
            boxShadow: 6,
            bgcolor: '#fff',
            border: '1px solid #f1f1f1',
          },
        }}
        MenuListProps={{
          sx: {
            py: 0,
            color: '#222',
            fontFamily: '"Segoe UI", Arial, sans-serif',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.3, borderBottom: '1px solid #ececec', bgcolor: '#fafbfc' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 22, letterSpacing: 0.2, mb: 0.6, color: '#222' }}>
            Notifications
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant={filter === 'all' ? 'contained' : 'text'}
              onClick={() => handleFilter('all')}
              sx={{
                textTransform: 'none',
                minWidth: 60,
                bgcolor: filter === 'all' ? '#e5e5e5' : 'transparent',
                color: filter === 'all' ? '#222' : '#828282',
                fontWeight: 600,
                borderRadius: 2,
                fontSize: 14,
                px: 2,
                py: 0.5,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#e1e7ee', color: '#000' },
              }}
            >
              All
            </Button>
            <Button
              size="small"
              variant={filter === 'unread' ? 'contained' : 'text'}
              onClick={() => handleFilter('unread')}
              sx={{
                textTransform: 'none',
                minWidth: 60,
                bgcolor: filter === 'unread' ? '#e5e5e5' : 'transparent',
                color: filter === 'unread' ? '#222' : '#828282',
                fontWeight: 600,
                borderRadius: 2,
                fontSize: 14,
                px: 2,
                py: 0.5,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#e1e7ee', color: '#000' },
              }}
            >
              Unread
            </Button>
          </Stack>
        </Box>
        {filteredNotifications.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center', color: '#aaa', fontSize: 14 }}>
            <NotificationsNoneIcon sx={{ fontSize: 32, mb: 0.5, color: '#ccc' }} />
            <Typography sx={{ fontSize: 15, color: '#aaa' }}>
              No notifications
            </Typography>
          </Box>
        )}
        {filteredNotifications.map((notif) => (
          <MenuItem
            key={notif.id}
            disableGutters
            selected={!notif.read}
            onClick={() => handleNotifClick(notif)} 
            sx={{
              alignItems: 'flex-start',
              bgcolor: notif.read ? 'transparent' : '#faf7d4',
              borderRadius: 1.4,
              my: 0.2,
              px: 2,
              py: 1,
              minHeight: 53,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: '#fffbe2',
              },
              display: 'flex',
              gap: 1.5,
            }}
          >
            <Box sx={{ pt: 0.4 }}>
              <NotificationsActiveIcon sx={{ fontSize: 24, color: notif.read ? '#d3d3d3' : '#f9a825' }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                sx={{
                  fontSize: 15,
                  color: notif.read ? '#282828' : '#000',
                  fontWeight: notif.read ? 400 : 700,
                  lineHeight: 1.32,
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                }}
              >
                {notif.message}
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  color: '#989898',
                  fontWeight: 500,
                  letterSpacing: 0.1,
                  mt: 0.5,
                }}
              >
                {new Date(notif.createdAt).toLocaleDateString(undefined, { month:'short', day:'numeric' })}
                {' · '}
                {new Date(notif.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
              </Typography>
            </Box>
            {!notif.read && (
              <Box sx={{ ml: 0.5, pt: 1 }}>
                <Box sx={{ width: 8, height: 8, bgcolor: '#2299ee', borderRadius: '50%' }} />
              </Box>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
