// src/controllers/teacherCourseController.ts
import type {Response } from "express";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../types/request.js";

/**
 * Liste des cours du formateur connecté
 * GET /api/teacher/courses
 */
export const listTeacherCourses = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const courses = await prisma.courses.findMany({
      where: { teacher_id: req.user.id },
      orderBy: { course_id: "desc" },
      select: {
        course_id: true,
        title: true,
        description: true,
        start_date: true,
        credits: true,
        course_type: true,
      },
    });

    res.json(courses);
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Server error" });
  }
};

/**
 * Détail d’un cours spécifique appartenant au formateur
 * GET /api/teacher/courses/:id
 */
export const getTeacherCourse = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const course = await prisma.courses.findFirst({
      where: { course_id: id, teacher_id: req.user.id },
      include: {
        course_resources: true,
      },
    });

    if (!course) return res.status(404).json({ error: "Course not found or not assigned to you" });
    res.json(course);
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Server error" });
  }
};

/**
 * Mise à jour (titre + description uniquement)
 * PATCH /api/teacher/courses/:id
 */
export const updateTeacherCourse = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const course = await prisma.courses.findFirst({
      where: { course_id: id, teacher_id: req.user.id },
    });
    if (!course) return res.status(404).json({ error: "Course not found" });

    const { title, description } = req.body;
    const updated = await prisma.courses.update({
      where: { course_id: id },
      data: { title, description },
    });

    res.json({ message: "Course updated successfully", course: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Server error" });
  }
};

/**
 * Upload d'une ressource de cours
 * POST /api/teacher/courses/:id/upload
 */
export const uploadTeacherResource = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const file = req.file;

    const courseId = Number(req.params.id);
    if (!Number.isFinite(courseId)) return res.status(400).json({ error: "Invalid course id" });

    const course = await prisma.courses.findFirst({
      where: { course_id: courseId, teacher_id: req.user.id },
      select: { course_id: true, title: true },
    });
    if (!course) return res.status(404).json({ error: "Course not found or not assigned to you" });

    let pending = await prisma.resource_statuses.findUnique({ where: { name: "Pending" } });
    if (!pending) pending = await prisma.resource_statuses.create({ data: { name: "Pending" } });

    const { title, description } = req.body as { title?: string; description?: string };

    const newResource = await prisma.$transaction(async (tx) => {
      const created = await tx.course_resources.create({
        data: {
          course_id: course.course_id,
          title: title || file.originalname,
          description: description || null,
          file_size: file.size,
          mime_type: file.mimetype,
          resource_type: "file",
          status_id: pending!.status_id,
          uploaded_by: req.user!.id,
          is_visible: false,
        },
      });

      await tx.resource_files.upsert({
        where: { resource_id: created.resource_id },
        update: {
          data: new Uint8Array(file.buffer),
          original_name: file.originalname,
        },
        create: {
          resource_id: created.resource_id,
          data: new Uint8Array(file.buffer),
          original_name: file.originalname,
          updated_at: new Date(),
        },
      });

      return tx.course_resources.update({
        where: { resource_id: created.resource_id },
        data: {
          file_path: `/api/courses/resources/${created.resource_id}/file`,
        },
      });
    });

    res.status(201).json({ message: "Resource uploaded successfully", resource: newResource });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Server error" });
  }
};

/**
 * Supprimer une ressource
 * DELETE /api/teacher/courses/:id/resources/:resourceId
 */
export const deleteTeacherResource = async (req: AuthRequest, res: Response) => {
  try {
    const courseId = Number(req.params.id);
    const resourceId = Number(req.params.resourceId);
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!Number.isFinite(courseId) || !Number.isFinite(resourceId))
      return res.status(400).json({ error: "Invalid id" });

    const course = await prisma.courses.findFirst({
      where: { course_id: courseId, teacher_id: req.user.id },
    });
    if (!course) return res.status(404).json({ error: "Course not found" });

    const resource = await prisma.course_resources.findFirst({
      where: { resource_id: resourceId, course_id: courseId },
    });
    if (!resource) return res.status(404).json({ error: "Resource not found" });

    await prisma.course_resources.delete({ where: { resource_id: resourceId } });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Server error" });
  }
};
