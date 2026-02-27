import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  Card
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Description as DescriptionIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface StudentDocument {
  document_id: number;
  profile_id: number;
  title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number;
  uploaded_at: string;
  description?: string;
  admin: {
    first_name: string;
    last_name: string;
  };
  student_profile: {
    first_name: string;
    last_name: string;
    profile_id: number;
  };
}

interface StudentDocumentsProps {
  profileId: number;
  studentName: string;
  onClose?: () => void;
}

interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

const StudentDocuments: React.FC<StudentDocumentsProps> = ({ profileId, studentName, onClose }) => {
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Types de fichiers acceptés et taille maximale
  const acceptedFileTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.txt'];
  const maxFileSize = 10 * 1024 * 1024;

  useEffect(() => {
    if (profileId) fetchDocuments();
  }, [profileId]);

  const fetchDocuments = async () => {
    try {
      setFetchLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showSnackbar("Token d'authentification manquant. Veuillez vous reconnecter.", 'error');
        setFetchLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/studentProfiles/${profileId}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });

      if (response.ok) {
        const result: ApiResponse<StudentDocument[]> = await response.json();
        if (result.status === 'success' && result.data) setDocuments(result.data);
        else showSnackbar(result.message || 'Erreur lors du chargement des documents', 'error');
      } else {
        if (response.status === 401) {
          localStorage.removeItem('token');
          showSnackbar('Session expirée. Veuillez vous reconnecter.', 'error');
          setTimeout(() => (window.location.href = '/login'), 2000);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || `Erreur ${response.status}`);
        }
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Erreur lors du chargement des documents', 'error');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !title.trim()) {
      showSnackbar('Veuillez sélectionner un fichier et donner un titre', 'error');
      return;
    }

    // Vérification du type de fichier
    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      showSnackbar(`Type de fichier non autorisé. Types acceptés: ${acceptedFileTypes.join(', ')}`, 'error');
      return;
    }

    // Vérification de la taille du fichier
    if (selectedFile.size > maxFileSize) {
      showSnackbar(`Le fichier est trop volumineux. Taille maximale: ${formatFileSize(maxFileSize)}`, 'error');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('title', title);
    if (description) formData.append('description', description);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showSnackbar('Token manquant.', 'error');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/studentProfiles/${profileId}/documents`, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });

      const result: ApiResponse<StudentDocument> = await response.json();

      if (response.ok && result.status === 'success' && result.data) {
        setDocuments(prev => [result.data!, ...prev]);
        setOpenDialog(false);
        resetForm();
        showSnackbar('Document uploadé avec succès', 'success');
      } else throw new Error(result.message || "Erreur lors de l'upload");
    } catch (error: any) {
      showSnackbar(error.message || "Erreur lors de l'upload", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce document ?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showSnackbar('Token manquant. Veuillez vous reconnecter.', 'error');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/studentProfiles/documents/${documentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });

      const result: ApiResponse<null> = await response.json();

      if (response.ok && result.status === 'success') {
        setDocuments(prev => prev.filter(doc => doc.document_id !== documentId));
        showSnackbar('Document supprimé avec succès', 'success');
      } else throw new Error(result.message || 'Erreur lors de la suppression');
    } catch (error: any) {
      showSnackbar(error.message || 'Erreur lors de la suppression', 'error');
    }
  };

  const handleDownload = async (doc: StudentDocument) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showSnackbar('Token manquant. Veuillez vous reconnecter.', 'error');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/studentProfiles/documents/${doc.document_id}/download`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Erreur lors du téléchargement');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file_name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSnackbar('Téléchargement réussi', 'success');
    } catch (err: any) {
      showSnackbar(err.message || 'Erreur lors du téléchargement', 'error');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setDescription('');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    return '📎';
  };

  return (
    <Box>
      <Card sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              📁 Gestion des Documents
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Étudiant: <strong>{studentName}</strong> (ID Profil: {profileId})
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: 2 }}>
              Ajouter un document
            </Button>
            {onClose && (
              <Button variant="outlined" onClick={onClose} startIcon={<CloseIcon />}>
                Fermer
              </Button>
            )}
          </Box>
        </Box>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Document</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell><strong>Taille</strong></TableCell>
              <TableCell><strong>Uploadé le</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fetchLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                  <Typography>Chargement...</Typography>
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <DescriptionIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
                  <Typography>Aucun document pour cet étudiant</Typography>
                </TableCell>
              </TableRow>
            ) : (
              documents.map(document => (
                <TableRow key={document.document_id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Typography sx={{ mr: 1 }}>{getFileIcon(document.mime_type)}</Typography>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">{document.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{document.file_name}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{document.description || '—'}</TableCell>
                  <TableCell>{formatFileSize(document.file_size)}</TableCell>
                  <TableCell>{formatDate(document.uploaded_at)}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <IconButton color="primary" title="Télécharger" size="small" onClick={() => handleDownload(document)}>
                        <DownloadIcon />
                      </IconButton>
                      <IconButton color="error" title="Supprimer" size="small" onClick={() => handleDelete(document.document_id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => !loading && setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un document</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3}>
            <TextField label="Titre du document *" value={title} onChange={e => setTitle(e.target.value)} fullWidth disabled={loading} />
            <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} multiline rows={3} fullWidth disabled={loading} />
            <Button variant="outlined" component="label" startIcon={<DescriptionIcon />} disabled={loading}>
              {selectedFile ? `Fichier: ${selectedFile.name}` : 'Sélectionner un fichier *'}
              <input 
                type="file" 
                hidden 
                onChange={e => setSelectedFile(e.target.files?.[0] || null)} 
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt" 
              />
            </Button>
            

            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Types de fichiers acceptés :
              </Typography>
              <Typography variant="body2">
                📄 PDF, 🖼️ JPG/JPEG/PNG, 📝 DOC/DOCX, 📋 TXT
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Taille maximale :</strong> {formatFileSize(maxFileSize)}
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} variant="outlined" disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleFileUpload} variant="contained" disabled={!selectedFile || !title.trim() || loading} startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}>
            {loading ? 'Upload...' : 'Uploader'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentDocuments;
