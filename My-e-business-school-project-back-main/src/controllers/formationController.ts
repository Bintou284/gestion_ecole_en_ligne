import type { Response } from "express";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../types/request.js";
import type { Request, NextFunction } from "express";



/**
 * POST /api/formations
 * Body: { title, description, mode, duration, level }
 */
export const createFormation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, mode, duration, level, teacherIds } = req.body as {
      title: string;
      description?: string | null;
      mode: string;
      duration?: string | null;
      level?: string | null;
      teacherIds?: number[];
    };

    if (!title?.trim() || !mode?.trim()) {
      return res.status(400).json({ error: "title et mode sont requis" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const formation = await tx.formations.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          mode: mode.trim(),
          duration: duration?.trim() || null,
          level: level?.trim() || null,
        },
      });

      if (Array.isArray(teacherIds) && teacherIds.length > 0) {
        // Vérifier que tous sont bien des profs (role_id=2)
        const validTeachers = await tx.user_roles.findMany({
          where: { role_id: 2, user_id: { in: teacherIds } },
          select: { user_id: true },
        });
        const validIds = new Set(validTeachers.map((t) => t.user_id));
        const toInsert = teacherIds
          .filter((id) => validIds.has(id))
          .map((id) => ({ formation_id: formation.formation_id, teacher_id: id }));

        if (toInsert.length > 0) {
          await tx.formation_teachers.createMany({ data: toInsert, skipDuplicates: true });
        }
      }

      return formation;
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/formations
 */
export const listFormations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formations = await prisma.formations.findMany({
      orderBy: { formation_id: "asc" },
    });
    res.json(formations);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/formations/:id
 */
export const deleteFormation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    await prisma.formations.delete({
      where: { formation_id: id },
    });

    res.json({ message: "Formation deleted successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/formations/:id
 */
export const getFormationById = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const formation = await prisma.formations.findUnique({
      where: { formation_id: id },
    });

    if (!formation) return res.status(404).json({ error: "Formation not found" });
    res.json(formation);
  } catch (err) {
    next(err);
  }
};



export const updateFormation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const { title, description, mode, duration, level } = req.body as {
      title?: string; description?: string | null; mode?: string;
      duration?: string | null; level?: string | null;
    };

    // Validation min: si fourni, vérifier les champs obligatoires cohérents
    if (title !== undefined && !title.trim()) return res.status(400).json({ error: "Title cannot be empty" });
    if (mode !== undefined && !mode.trim()) return res.status(400).json({ error: "Mode cannot be empty" });

    const updated = await prisma.formations.update({
      where: { formation_id: id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(mode !== undefined ? { mode: mode.trim() } : {}),
        ...(duration !== undefined ? { duration: duration?.trim() || null } : {}),
        ...(level !== undefined ? { level: level?.trim() || null } : {}),
      },
    });

    res.json(updated);
  } catch (err) {
    // si l'id n'existe pas, Prisma lève une erreur
    next(err);
  }
};

// Lister les profs liés à une formation
export const getFormationTeachers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const links = await prisma.formation_teachers.findMany({
      where: { formation_id: id },
      include: {
        users: { select: { user_id: true, first_name: true, last_name: true, email: true } },
      },
      orderBy: [{ users: { last_name: "asc" } }, { users: { first_name: "asc" } }],
    });

    res.json(links.map((l) => l.users));
  } catch (err) {
    next(err);
  }
};

// SYNC des profs liés
export const syncFormationTeachers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const { teacherIds } = req.body as { teacherIds: number[] };

    if (!Array.isArray(teacherIds)) {
      return res.status(400).json({ error: "teacherIds (number[]) requis" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Vérification rôle=2
      const validTeachers = await tx.user_roles.findMany({
        where: { role_id: 2, user_id: { in: teacherIds } },
        select: { user_id: true },
      });
      const validIds = new Set(validTeachers.map((t) => t.user_id));

      // Suppression des liens actuels
      await tx.formation_teachers.deleteMany({ where: { formation_id: id } });

      // Insertion des nouveaux valides
      if (validIds.size > 0) {
        await tx.formation_teachers.createMany({
          data: Array.from(validIds).map((userId) => ({ formation_id: id, teacher_id: userId })),
          skipDuplicates: true,
        });
      }

      // Retourner la liste finale
      const final = await tx.formation_teachers.findMany({
        where: { formation_id: id },
        include: { users: { select: { user_id: true, first_name: true, last_name: true, email: true } } },
        orderBy: [{ users: { last_name: "asc" } }, { users: { first_name: "asc" } }],
      });

      return final.map((l) => l.users);
    });

    res.json({ formation_id: id, teachers: result });
  } catch (err) {
    next(err);
  }
};

// Récupération de toutes les formations 
export const getAllFormations = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const formations = await prisma.formations.findMany({
      orderBy: {
        title: 'asc'
      }
    });

    const formattedFormations = formations.map(formation => ({
      ...formation,
      id: formation.formation_id,
    }));

    res.json(formattedFormations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Récupération de tous les cours avec leurs relations 
export const getAllCoursesWithRelations = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const courses = await prisma.courses.findMany({
      include: {
        formation_courses: {
          include: {
            formations: {
              select: {
                formation_id: true,
                title: true
              }
            }
          }
        },
        sessions: {
          select: {
            session_id: true,
            start_time: true,
            end_time: true
          }
        },
        users: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    });

    // Formatage pour le frontend
    const formattedCourses = courses.map(course => ({
      course_id: course.course_id,
      title: course.title,
      teacher_id: course.teacher_id,
      teacher_name: course.users ? `${course.users.first_name} ${course.users.last_name}` : null,
      formation_courses: course.formation_courses.map(fc => ({
        formations: {
          formation_id: fc.formations.formation_id,
          title: fc.formations.title
        }
      })),
      sessions: course.sessions.map(session => ({
        session_id: session.session_id,
        start_time: session.start_time,
        end_time: session.end_time
      }))
    }));

    res.json(formattedCourses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
