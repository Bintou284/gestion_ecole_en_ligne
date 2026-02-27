import express from 'express';
import { studentDocumentsController, upload } from '../controllers/studentDocumentsController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/request.js';

const router = express.Router();

const handleUploadErrors = (err: any, req: AuthRequest, res: Response, next: NextFunction): void => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        status: 'error',
        message: 'Le fichier est trop volumineux (max 10MB)'
      });
      return;
    }
    res.status(400).json({
      status: 'error',
      message: err.message
    });
    return;
  }
  next();
};

router.use(authMiddleware);
router.use(requireRole('admin'));

router.get('/:id/documents', studentDocumentsController.getStudentDocuments);

router.post(
  '/:id/documents',
  upload.single('document'),
  handleUploadErrors,
  studentDocumentsController.uploadDocument
);

router.get('/documents/:id', studentDocumentsController.getDocument);
router.get('/documents/:id/download', studentDocumentsController.downloadDocument);
router.delete('/documents/:id', studentDocumentsController.deleteDocument);

export default router;