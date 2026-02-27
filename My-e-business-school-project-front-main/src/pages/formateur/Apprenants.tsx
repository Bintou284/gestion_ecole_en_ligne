import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Avatar,
  CircularProgress,
  Alert
} from '@mui/material';
import { motion } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_BACKEND_URL;

interface Student {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

const hoverEffect = {
  whileHover: { scale: 1.03, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' },
  whileTap: { scale: 0.97 },
};

export default function Apprenants() {
  const [apprenants, setApprenants] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<number | null>(null);

  // Récupérer l'ID du professeur depuis le token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Token introuvable. Merci de vous reconnecter.");
      setLoading(false);
      return;
    }

    try {
      const decoded: any = jwtDecode(token);
      setTeacherId(decoded.id);
    } catch (err) {
      console.error("Erreur de décodage du token:", err);
      setError("Impossible de décoder le token d'authentification.");
      setLoading(false);
    }
  }, []);

  // Récupérer les étudiants du professeur
  useEffect(() => {
    if (!teacherId) return;

    const fetchStudents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        // Récupérer directement les étudiants du professeur
        const response = await fetch(`${API_BASE_URL}/api/teachers/${teacherId}/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des étudiants");
        }

        const studentsData = await response.json();        
        setApprenants(studentsData);
        setError(null);
      } catch (err: any) {
        console.error("Erreur:", err);
        setError(err.message || "Erreur lors du chargement des apprenants");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [teacherId]);

  // Fonction pour obtenir les initiales
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getAvatarColor = (id: number) => {
    const colors = ['#ffeb3b', '#D4AF37', '#ffc107', '#ffb300', '#ffa000'];
    return colors[id % colors.length];
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: '#fefefe',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={50} thickness={4} sx={{ color: "#D4AF37", mb: 2 }} />
          <Typography variant="body1" color="text.secondary" fontWeight={500}>
            Chargement de vos apprenants...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ bgcolor: '#fefefe', minHeight: '100vh', py: 5 }}>
        <Container maxWidth="md">
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {error}
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#fefefe', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="md">
        <Typography variant="h4" fontWeight={800} sx={{ mb: 4, color: '#333' }}>
          Mes Apprenants
        </Typography>

        {apprenants.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              Aucun apprenant assigné pour le moment
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
              {apprenants.length} apprenant{apprenants.length > 1 ? 's' : ''} assigné{apprenants.length > 1 ? 's' : ''}
            </Typography>

            <Grid container spacing={3}>
              {apprenants.map((student) => (
                <Grid item xs={12} key={student.user_id}>
                  <motion.div {...hoverEffect}>
                    <Card
                      sx={{
                        borderRadius: 6,
                        boxShadow: 2,
                        cursor: 'pointer',
                        transition: '0.3s',
                        bgcolor: '#ffffff',
                      }}
                    >
                      <CardContent
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: getAvatarColor(student.user_id),
                              color: '#555',
                              fontWeight: 'bold',
                              fontSize: 18,
                              width: 48,
                              height: 48,
                            }}
                          >
                            {getInitials(student.first_name, student.last_name)}
                          </Avatar>
                          <Box>
                            <Typography fontWeight={700}>
                              {student.first_name} {student.last_name}
                            </Typography>
                            <Typography variant="body2" color="#777">
                              {student.email}
                            </Typography>
                          </Box>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="#888" fontWeight={600}>
                            Étudiant actif
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
}