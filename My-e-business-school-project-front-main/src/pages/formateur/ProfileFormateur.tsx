import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Card, CardContent, Button, Box,
  TextField, Stack, Snackbar, Alert, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Avatar, Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import SchoolIcon from '@mui/icons-material/School';
import LockIcon from '@mui/icons-material/Lock';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

interface TeacherProfileData {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  roles: string[];
  created_at: string;
}

interface BankDetails {
  iban: string | null;
  bic: string | null;
  account_holder: string | null;
  updated_at: string | null;
}

const apiService = {
  async getProfile(): Promise<{ success: boolean; data: TeacherProfileData }> {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Erreur');
    return response.json();
  },

  async updateProfile(data: any): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Erreur');
    return response.json();
  },

  async updatePassword(data: { current_password: string; new_password: string }): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/profile/password', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur');
    }
    return response.json();
  },

  async getBankDetails(): Promise<{ success: boolean; data: BankDetails }> {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/bank-details', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Erreur');
    return response.json();
  },

  async updateBankDetails(data: { iban?: string; bic?: string; account_holder?: string }): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/bank-details', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour du RIB');
    }
    return response.json();
  }
};

const MonProfilFormateur: React.FC = () => {
  const [profile, setProfile] = useState<TeacherProfileData | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [editingBank, setEditingBank] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const [emailForm, setEmailForm] = useState({ email: '' });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [bankForm, setBankForm] = useState({
    iban: '',
    bic: '',
    account_holder: ''
  });

  useEffect(() => {
    fetchProfile();
    fetchBankDetails();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProfile();
      setProfile(response.data);
      setEmailForm({ email: response.data.email });
    } catch (error) {
      showSnackbar('Erreur lors du chargement du profil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBankDetails = async () => {
    try {
      const response = await apiService.getBankDetails();
      setBankDetails(response.data);
      setBankForm({
        iban: response.data.iban || '',
        bic: response.data.bic || '',
        account_holder: response.data.account_holder || ''
      });
    } catch (error) {
      console.error('Erreur chargement RIB:', error);
    }
  };

  const handleUpdateEmail = async () => {
    try {
      setLoading(true);
      await apiService.updateProfile({ email: emailForm.email });
      showSnackbar('Email mis à jour avec succès');
      setEditingEmail(false);
      fetchProfile();
    } catch (error) {
      showSnackbar('Erreur lors de la mise à jour de l\'email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showSnackbar('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      showSnackbar('Le mot de passe doit contenir au moins 6 caractères', 'error');
      return;
    }

    try {
      setLoading(true);
      await apiService.updatePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      showSnackbar('Mot de passe mis à jour avec succès');
      setEditingPassword(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      showSnackbar(error.message || 'Erreur lors de la mise à jour du mot de passe', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBankDetails = async () => {
    try {
      setLoading(true);
      await apiService.updateBankDetails({
        iban: bankForm.iban || undefined,
        bic: bankForm.bic || undefined,
        account_holder: bankForm.account_holder || undefined
      });
      showSnackbar('Informations bancaires mises à jour avec succès');
      setEditingBank(false);
      fetchBankDetails();
    } catch (error: any) {
      showSnackbar(error.message || 'Erreur lors de la mise à jour du RIB', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading && !profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography sx={{ fontFamily: 'Montserrat', color: '#D4AF37' }}>
            Chargement...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!profile) return null;

  const initials = `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`;

  return (
    <Box sx={{ bgcolor: '#ffffff', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        {/* Header  */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
            borderRadius: 4,
            p: 4,
            mb: 4,
            boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                bgcolor: '#ffffff',
                color: '#D4AF37',
                fontSize: '3rem',
                fontFamily: 'Archivo Black',
                border: '4px solid #ffffff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                margin: '0 auto 16px'
              }}
            >
              {initials}
            </Avatar>
            <Typography
              variant="h3"
              sx={{
                fontFamily: 'Archivo Black',
                color: '#ffffff',
                mb: 0.5,
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {profile.first_name} {profile.last_name}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Roboto',
                color: '#ffffff',
                opacity: 0.95
              }}
            >
              Formateur à La Ruche Académie
            </Typography>
          </Box>
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.1)',
              zIndex: 0
            }}
          />
        </Box>

        {/* Informations personnelles */}
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #f5f5f5',
            mb: 3
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'Roboto',
                fontWeight: 700,
                color: '#C5A028',
                mb: 3,
                pb: 2,
                borderBottom: '3px solid #D4AF37'
              }}
            >
              Informations personnelles
            </Typography>

            <Stack spacing={3}>
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <SchoolIcon sx={{ fontSize: 20, color: '#D4AF37' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'Montserrat',
                      color: '#C5A028',
                      fontWeight: 600
                    }}
                  >
                    Nom complet
                  </Typography>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: 'Montserrat',
                    color: '#212121',
                    ml: 4
                  }}
                >
                  {profile.first_name} {profile.last_name}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <PhoneIcon sx={{ fontSize: 20, color: '#D4AF37' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'Montserrat',
                      color: '#C5A028',
                      fontWeight: 600
                    }}
                  >
                    Téléphone
                  </Typography>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: 'Montserrat',
                    color: '#212121',
                    ml: 4
                  }}
                >
                  {profile.phone || 'Non renseigné'}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Informations de connexion */}
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '2px solid #D4AF37',
            bgcolor: '#FFF9E5'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'Roboto',
                fontWeight: 700,
                color: '#C5A028',
                mb: 3,
                pb: 2,
                borderBottom: '3px solid #D4AF37'
              }}
            >
              Informations de connexion
            </Typography>

            <Stack spacing={3}>
              <Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <EmailIcon sx={{ fontSize: 20, color: '#D4AF37' }} />
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Montserrat',
                        color: '#C5A028',
                        fontWeight: 600
                      }}
                    >
                      Email
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setEditingEmail(true)}
                    sx={{
                      fontFamily: 'Montserrat',
                      color: '#C5A028',
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#FFF9E5' }
                    }}
                  >
                    Modifier
                  </Button>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: 'Montserrat',
                    color: '#212121',
                    ml: 4
                  }}
                >
                  {profile.email}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LockIcon sx={{ fontSize: 20, color: '#D4AF37' }} />
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Montserrat',
                        color: '#C5A028',
                        fontWeight: 600
                      }}
                    >
                      Mot de passe
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setEditingPassword(true)}
                    sx={{
                      fontFamily: 'Montserrat',
                      color: '#C5A028',
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#FFF9E5' }
                    }}
                  >
                    Modifier
                  </Button>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: 'Montserrat',
                    color: '#212121',
                    ml: 4
                  }}
                >
                  ••••••••
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Informations bancaires */}
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '2px solid #D4AF37',
            bgcolor: '#FFF9E5'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'Roboto',
                fontWeight: 700,
                color: '#C5A028',
                mb: 3,
                pb: 2,
                borderBottom: '3px solid #D4AF37'
              }}
            >
              Informations bancaires
            </Typography>

            <Stack spacing={3}>
              {/* IBAN */}
              <Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AccountBalanceIcon sx={{ fontSize: 20, color: '#D4AF37' }} />
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Montserrat',
                        color: '#C5A028',
                        fontWeight: 600
                      }}
                    >
                      IBAN
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setEditingBank(true)}
                    sx={{
                      fontFamily: 'Montserrat',
                      color: '#C5A028',
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#FFF9E5' }
                    }}
                  >
                    Modifier
                  </Button>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: 'Montserrat',
                    color: '#212121',
                    ml: 4
                  }}
                >
                  {bankDetails?.iban || 'Non renseigné'}
                </Typography>
              </Box>

              <Divider />

              {/* BIC */}
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <AccountBalanceIcon sx={{ fontSize: 20, color: '#D4AF37' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'Montserrat',
                      color: '#C5A028',
                      fontWeight: 600
                    }}
                  >
                    BIC/SWIFT
                  </Typography>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: 'Montserrat',
                    color: '#212121',
                    ml: 4
                  }}
                >
                  {bankDetails?.bic || 'Non renseigné'}
                </Typography>
              </Box>

              <Divider />

              {/* Titulaire du compte */}
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <AccountBalanceIcon sx={{ fontSize: 20, color: '#D4AF37' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'Montserrat',
                      color: '#C5A028',
                      fontWeight: 600
                    }}
                  >
                    Titulaire du compte
                  </Typography>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: 'Montserrat',
                    color: '#212121',
                    ml: 4
                  }}
                >
                  {bankDetails?.account_holder || 'Non renseigné'}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Dialog
          open={editingEmail}
          onClose={() => setEditingEmail(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { borderRadius: 4 } }}
        >
          <DialogTitle sx={{ fontFamily: 'Roboto', fontWeight: 700, color: '#C5A028', pb: 1 }}>
            Modifier l'email
            <IconButton
              onClick={() => setEditingEmail(false)}
              sx={{ position: 'absolute', right: 8, top: 8, color: '#C5A028' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <TextField
              label="Nouvel email"
              type="email"
              fullWidth
              value={emailForm.email}
              onChange={(e) => setEmailForm({ email: e.target.value })}
              disabled={loading}
              sx={{ mt: 2 }}
              InputProps={{ sx: { fontFamily: 'Montserrat', borderRadius: 2 } }}
              InputLabelProps={{ sx: { fontFamily: 'Montserrat' } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setEditingEmail(false)}
              variant="outlined"
              disabled={loading}
              sx={{
                fontFamily: 'Montserrat',
                borderColor: '#D4AF37',
                color: '#C5A028',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { borderColor: '#C5A028', bgcolor: '#FFF9E5' }
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdateEmail}
              variant="contained"
              disabled={loading}
              sx={{
                fontFamily: 'Montserrat',
                bgcolor: '#D4AF37',
                color: '#ffffff',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#C5A028' }
              }}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={editingPassword}
          onClose={() => setEditingPassword(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { borderRadius: 4 } }}
        >
          <DialogTitle sx={{ fontFamily: 'Roboto', fontWeight: 700, color: '#C5A028', pb: 1 }}>
            Modifier le mot de passe
            <IconButton
              onClick={() => setEditingPassword(false)}
              sx={{ position: 'absolute', right: 8, top: 8, color: '#C5A028' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Mot de passe actuel"
                type="password"
                fullWidth
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                disabled={loading}
                InputProps={{ sx: { fontFamily: 'Montserrat', borderRadius: 2 } }}
                InputLabelProps={{ sx: { fontFamily: 'Montserrat' } }}
              />
              <TextField
                label="Nouveau mot de passe"
                type="password"
                fullWidth
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                disabled={loading}
                InputProps={{ sx: { fontFamily: 'Montserrat', borderRadius: 2 } }}
                InputLabelProps={{ sx: { fontFamily: 'Montserrat' } }}
              />
              <TextField
                label="Confirmer le nouveau mot de passe"
                type="password"
                fullWidth
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                disabled={loading}
                InputProps={{ sx: { fontFamily: 'Montserrat', borderRadius: 2 } }}
                InputLabelProps={{ sx: { fontFamily: 'Montserrat' } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setEditingPassword(false)}
              variant="outlined"
              disabled={loading}
              sx={{
                fontFamily: 'Montserrat',
                borderColor: '#D4AF37',
                color: '#C5A028',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { borderColor: '#C5A028', bgcolor: '#FFF9E5' }
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdatePassword}
              variant="contained"
              disabled={loading}
              sx={{
                fontFamily: 'Montserrat',
                bgcolor: '#D4AF37',
                color: '#ffffff',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#C5A028' }
              }}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog modification RIB */}
        <Dialog
          open={editingBank}
          onClose={() => setEditingBank(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { borderRadius: 4 } }}
        >
          <DialogTitle sx={{ fontFamily: 'Roboto', fontWeight: 700, color: '#C5A028', pb: 1 }}>
            Modifier les informations bancaires
            <IconButton
              onClick={() => setEditingBank(false)}
              sx={{ position: 'absolute', right: 8, top: 8, color: '#C5A028' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="IBAN"
                type="text"
                fullWidth
                value={bankForm.iban}
                onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value.toUpperCase() })}
                disabled={loading}
                placeholder="FR76 1234 5678 9012 3456 7890 123"
                helperText="Format: 27 caractères pour un IBAN français"
                InputProps={{ sx: { fontFamily: 'Montserrat', borderRadius: 2 } }}
                InputLabelProps={{ sx: { fontFamily: 'Montserrat' } }}
              />
              <TextField
                label="BIC/SWIFT"
                type="text"
                fullWidth
                value={bankForm.bic}
                onChange={(e) => setBankForm({ ...bankForm, bic: e.target.value.toUpperCase() })}
                disabled={loading}
                placeholder="BNPAFRPPXXX"
                helperText="8 ou 11 caractères"
                InputProps={{ sx: { fontFamily: 'Montserrat', borderRadius: 2 } }}
                InputLabelProps={{ sx: { fontFamily: 'Montserrat' } }}
              />
              <TextField
                label="Titulaire du compte"
                type="text"
                fullWidth
                value={bankForm.account_holder}
                onChange={(e) => setBankForm({ ...bankForm, account_holder: e.target.value })}
                disabled={loading}
                placeholder="Nom du titulaire"
                InputProps={{ sx: { fontFamily: 'Montserrat', borderRadius: 2 } }}
                InputLabelProps={{ sx: { fontFamily: 'Montserrat' } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setEditingBank(false)}
              variant="outlined"
              disabled={loading}
              sx={{
                fontFamily: 'Montserrat',
                borderColor: '#D4AF37',
                color: '#C5A028',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { borderColor: '#C5A028', bgcolor: '#FFF9E5' }
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdateBankDetails}
              variant="contained"
              disabled={loading}
              sx={{
                fontFamily: 'Montserrat',
                bgcolor: '#D4AF37',
                color: '#ffffff',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#C5A028' }
              }}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%', fontFamily: 'Montserrat', borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default MonProfilFormateur;
