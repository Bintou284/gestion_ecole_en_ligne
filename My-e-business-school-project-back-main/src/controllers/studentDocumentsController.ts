import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/request.js';

const prisma = new PrismaClient();

const storage = multer.memoryStorage();

const fileFilter = (req: AuthRequest, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.txt'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(fileExt)) cb(null, true);
  else cb(new Error('Type de fichier non autorisé. Formats acceptés: PDF, JPG, PNG, DOC, DOCX, TXT'));
};

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

export const studentDocumentsController = {
  getStudentDocuments: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      let id: string | undefined = req.params.id;

      if (!id) {
        const urlParts = req.originalUrl.split('/');
        const index = urlParts.indexOf('studentProfiles');
        if (index !== -1 && index + 1 < urlParts.length) id = urlParts[index + 1];
      }

      if (!id) {
        const match = req.originalUrl.match(/studentProfiles\/(\d+)/);
        if (match) id = match[1];
      }

      if (!id || isNaN(parseInt(id))) {
        res.status(400).json({ status: 'error', message: 'ID de profil invalide ou manquant' });
        return;
      }

      const documents = await prisma.student_documents.findMany({
        where: { profile_id: parseInt(id) },
        include: {
          admin: { select: { first_name: true, last_name: true } },
          student_profile: { select: { first_name: true, last_name: true, profile_id: true } }
        },
        orderBy: { uploaded_at: 'desc' }
      });

      res.json({ status: 'success', data: documents });
    } catch (error) {
      next(error);
    }
  },

  uploadDocument: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      let id: string | undefined = req.params.id;

      if (!id) {
        const urlParts = req.originalUrl.split('/');
        const index = urlParts.indexOf('studentProfiles');
        if (index !== -1 && index + 1 < urlParts.length) id = urlParts[index + 1];
      }

      if (!id) {
        const match = req.originalUrl.match(/studentProfiles\/(\d+)/);
        if (match) id = match[1];
      }

      const { title, description } = req.body;
      const file = req.file;

      if (!file) {
        res.status(400).json({ status: 'error', message: 'Aucun fichier uploadé' });
        return;
      }

      if (!title || title.trim() === '') {
        res.status(400).json({ status: 'error', message: 'Le titre du document est obligatoire' });
        return;
      }

      if (!id || isNaN(parseInt(id))) {
        res.status(400).json({ status: 'error', message: 'ID de profil invalide' });
        return;
      }

      const profileIdNum = parseInt(id);
      const studentProfile = await prisma.student_profiles.findUnique({ where: { profile_id: profileIdNum } });

      if (!studentProfile) {
        res.status(404).json({ status: 'error', message: 'Profil étudiant non trouvé' });
        return;
      }

      const document = await prisma.$transaction(async (tx) => {
        const created = await tx.student_documents.create({
          data: {
            profile_id: profileIdNum,
            title: title.trim(),
            file_name: file.originalname,
            file_path: '',
            file_size: file.size,
            mime_type: file.mimetype,
            uploaded_by: req.user!.id,
            description: description ? description.trim() : null
          }
        });

        await tx.student_document_files.create({
          data: {
            document_id: created.document_id,
            data: new Uint8Array(file.buffer),
            original_name: file.originalname,
            updated_at: new Date()
          }
        });

        const downloadPath = `/api/studentProfiles/documents/${created.document_id}/download`;

        return tx.student_documents.update({
          where: { document_id: created.document_id },
          data: { file_path: downloadPath },
          include: {
            admin: { select: { first_name: true, last_name: true } },
            student_profile: { select: { first_name: true, last_name: true, profile_id: true } }
          }
        });
      });

      res.status(201).json({ status: 'success', data: document });
    } catch (error) {
      next(error);
    }
  },

  deleteDocument: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || isNaN(parseInt(id))) {
        res.status(400).json({ status: 'error', message: 'ID invalide' });
        return;
      }
      
      const document = await prisma.student_documents.findUnique({ where: { document_id: parseInt(id) } });

      if (!document) {
        res.status(404).json({ status: 'error', message: 'Document non trouvé' });
        return;
      }

      await prisma.student_documents.delete({ where: { document_id: parseInt(id) } });

      res.json({ status: 'success', message: 'Document supprimé avec succès' });
    } catch (error) {
      next(error);
    }
  },

  downloadDocument: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || isNaN(parseInt(id))) {
        res.status(400).json({ status: 'error', message: 'ID invalide' });
        return;
      }
      
      const document = await prisma.student_documents.findUnique({ where: { document_id: parseInt(id) } });

      if (!document) {
        res.status(404).json({ status: 'error', message: 'Document non trouvé' });
        return;
      }

      const storedFile = await prisma.student_document_files.findUnique({
        where: { document_id: document.document_id },
        select: { data: true, original_name: true }
      });

      if (storedFile) {
        const filename = storedFile.original_name || document.file_name;
        res.setHeader('Content-Type', document.mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Content-Length', storedFile.data.length.toString());
        res.send(Buffer.from(storedFile.data));
        return;
      }

      if (!fs.existsSync(document.file_path)) {
        res.status(404).json({ status: 'error', message: 'Fichier non trouvé sur le serveur' });
        return;
      }

      res.setHeader('Content-Type', document.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
      fs.createReadStream(document.file_path).pipe(res);
    } catch (error) {
      next(error);
    }
  },

  getDocument: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || isNaN(parseInt(id))) {
        res.status(400).json({ status: 'error', message: 'ID invalide' });
        return;
      }
      
      const document = await prisma.student_documents.findUnique({
        
        where: { document_id: parseInt(id) },
        include: {
          admin: { select: { first_name: true, last_name: true } },
          student_profile: { select: { first_name: true, last_name: true, profile_id: true } }
        }
      });

      if (!document) {
        res.status(404).json({ status: 'error', message: 'Document non trouvé' });
        return;
      }

      res.json({ status: 'success', data: document });
    } catch (error) {
      next(error);
    }
  }
};
