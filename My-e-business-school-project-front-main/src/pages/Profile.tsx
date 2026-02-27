import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, CircularProgress, Box, Typography } from '@mui/material';

interface UserProfile {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  roles: string[];
}

const apiService = {
  async getProfile(): Promise<{ success: boolean; data: UserProfile }> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token non trouvé');
    }
    
    const response = await fetch('http://localhost:3000/api/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du profil');
    }
    
    return response.json();
  }
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndRedirect = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login', { replace: true });
          return;
        }

        const response = await apiService.getProfile();
        const { roles } = response.data;

        // Redirection selon le rôle prioritaire
        if (roles.includes('admin')) {
          navigate('/admin/profileadmin', { replace: true });
        } else if (roles.includes('teacher')) {
          navigate('/formateur/profileformateur', { replace: true });
        } else if (roles.includes('student')) {
          navigate('/etudiant/profilestudent', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndRedirect();
  }, [navigate]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3, color: '#D4AF37' }}>
            Chargement de votre profil...
          </Typography>
        </Box>
      </Container>
    );
  }

  return null;
};

export default Profile;