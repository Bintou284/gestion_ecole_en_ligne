import type { Request, Response } from "express";
import { validationResult } from "express-validator";
import fs from "fs";
import path from "path";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../types/request.js";
import { notifyUsers, sendNotificationEvent } from "../services/notificationProducer.js"; 


export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { title, description, teacher_id, start_date, credits, course_type, formation_id } = req.body;
    if (!teacher_id) return res.status(400).json({ error: "teacher_id is required" });
    if (!formation_id) return res.status(400).json({ error: "formation_id is required" });

    const formationId = Number(formation_id);
    if (!Number.isFinite(formationId)) {
      return res.status(400).json({ error: "Invalid formation_id" });
    }

    const teacher = await prisma.users.findUnique({
      where: { user_id: Number(teacher_id) },
      include: { user_roles: { include: { roles: true } } },
    });
    const isTeacher = teacher?.user_roles.some((ur: any) => ur.roles.role_name === "teacher");
    if (!isTeacher) return res.status(400).json({ error: "Assigned user is not a teacher" });

    const formation = await prisma.formations.findUnique({
      where: { formation_id: formationId },
      select: { formation_id: true },
    });
    if (!formation) return res.status(404).json({ error: "Formation not found" });

    const course = await prisma.courses.create({
      data: {
        title,
        description,
        start_date: start_date ? new Date(start_date) : null,
        credits: credits ? Number(credits) : null,
        course_type,
        teacher_id: Number(teacher_id),
        created_by_admin_id: req.user.id,
      },
    });

    await prisma.formation_courses.create({
      data: {
        course_id: course.course_id,
        formation_id: formationId,
      },
    });

    const courseWithRelations = await prisma.courses.findUnique({
      where: { course_id: course.course_id },
      include: {
        course_resources: true,
        users: { select: { first_name: true, last_name: true, email: true } },
        formation_courses: {
          include: {
            formations: { select: { formation_id: true, title: true } },
          },
        },
      },
    });

    await notifyUsers(
      [{ user_id: Number(teacher_id) }],
      `Nouveau cours "${title}" vous a été assigné.`,
      `/formateur/cours`
    );

    if (!courseWithRelations) {
      return res.status(201).json({ message: "Course created successfully", course });
    }

    res.status(201).json({ message: "Course created successfully", course: courseWithRelations });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Server error" });
  }
};



/**
 * PROF ou ADMIN : Liste des modules
 */
export const listCourses = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { search, page = "1", limit = "10" } = req.query;
    const where: any = {};

    if (req.user.role === "teacher") {
      where.teacher_id = req.user.id;
    }

    if (search) {
      where.title = { contains: search as string, mode: "insensitive" };
    }

    const { teacher_id, course_type, start_date_min, start_date_max, credits_min, credits_max } = req.query;
    if (teacher_id) where.teacher_id = Number(teacher_id);
    if (course_type) where.course_type = { equals: course_type as string, mode: "insensitive" };
    if (start_date_min || start_date_max) {
      where.start_date = {};
      if (start_date_min) where.start_date.gte = new Date(start_date_min as string);
      if (start_date_max) where.start_date.lte = new Date(start_date_max as string);
    }
    if (credits_min || credits_max) {
      where.credits = {};
      if (credits_min) where.credits.gte = Number(credits_min);
      if (credits_max) where.credits.lte = Number(credits_max);
    }

    const courses = await prisma.courses.findMany({
      where,
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
      include: {
        course_resources: true,
        users: { select: { first_name: true, last_name: true, email: true } }, // prof assigné
        formation_courses: {
          include: {
            formations: { select: { formation_id: true, title: true } },
          },
        },
      },
      orderBy: { course_id: "desc" },
    });

    res.json(courses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/** PROF : Détail d’un module qui lui appartient */
export const getCourse = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const courseId = Number(req.params.id);
    if (!Number.isFinite(courseId)) return res.status(400).json({ error: "Invalid id" });

    const course = await prisma.courses.findFirst({
      where: { course_id: courseId, teacher_id: req.user.id },
      include: { course_resources: true },
    });
    if (!course) return res.status(404).json({ error: "Course not found or not assigned to you" });

    res.json(course);
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Server error" });
  }
};

/** PROF : Upload d’une ressource (pdf/doc/docx) => statut Pending + notif Admins */
export const uploadResource = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const file = req.file;

    const courseId = Number(req.params.id);
    if (!Number.isFinite(courseId)) return res.status(400).json({ error: "Invalid id" });

    const course = await prisma.courses.findFirst({
      where: { course_id: courseId, teacher_id: req.user.id },
      select: { course_id: true, title: true },
    });
    if (!course) return res.status(404).json({ error: "Course not found or not assigned to you" });

    // statut Pending 
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
          updated_at: new Date(),                  
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

    // — Notifs : alerter tous les admins avec lien vers la page d’approbation
    try {
      const admins = await prisma.users.findMany({
        where: { user_roles: { some: { roles: { role_name: "admin" } } } },
        select: { user_id: true },
      });

      const redirectLink = `/admin/validations/ressources?focus=${newResource.resource_id}`;
      await notifyUsers(
        admins,
        `Ressource en attente : "${newResource.title}" (cours "${course.title}")`,
        redirectLink,
      );
    } catch (e) {
      console.error("Notif admins (uploadResource) KO:", e);
    }

    res.status(201).json({ message: "Resource uploaded successfully", resource: newResource });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Server error" });
  }
};

/** PROF : Supprimer une ressource de SON cours */
export const deleteCourseResource = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const courseId = Number(req.params.id);
    const resourceId = Number(req.params.resourceId);
    if (!Number.isFinite(courseId) || !Number.isFinite(resourceId)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const course = await prisma.courses.findFirst({
      where: { course_id: courseId, teacher_id: req.user.id },
      select: { course_id: true },
    });
    if (!course) return res.status(404).json({ error: "Course not found or not assigned to you" });

    const resource = await prisma.course_resources.findFirst({
      where: { resource_id: resourceId, course_id: course.course_id },
      select: { resource_id: true },
    });
    if (!resource) return res.status(404).json({ error: "Resource not found for this course" });

    await prisma.course_resources.delete({ where: { resource_id: resource.resource_id } });
    return res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Server error" });
  }
};

/**
 * ADMIN : Détail d’une ressource (inclut le nom du module + nom du prof)
 */
export const getCourseResourceById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const id = Number(req.params.resourceId);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const r = await prisma.course_resources.findUnique({
      where: { resource_id: id },
      select: {
        resource_id: true,
        title: true,
        description: true,
        file_path: true,
        mime_type: true,
        file_size: true,
        course_id: true,
        is_visible: true,
        status_id: true,
        // relation vers le cours + le prof (users)
        courses: {
          select: {
            title: true,
            users: {
              select: {
                first_name: true,
                last_name: true, 
              },
            },
          },
        },
      },
    });
    if (!r) return res.status(404).json({ error: "Not found" });

    const teacher_name =
      r.courses?.users
        ? `${r.courses.users.first_name ?? ""} ${r.courses.users.last_name ?? ""}`.trim()
        : null;

    return res.json({
      ...r,
      course_title: r.courses?.title ?? null,
      teacher_name,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message ?? "Server error" });
  }
};

/**
 * ADMIN : Lister les ressources en attente ( inclut nom du module + nom du prof)
 */
export const listPendingCourseResources = async (_req: AuthRequest, res: Response) => {
  try {
    const pending = await prisma.course_resources.findMany({
      where: { is_visible: false },
      orderBy: { resource_id: "desc" },
      select: {
        resource_id: true,
        title: true,
        description: true,
        file_path: true,
        mime_type: true,
        file_size: true,
        course_id: true,
        uploaded_by: true,
        is_visible: true,
        // relation vers le cours + le prof (users)
        courses: {
          select: {
            title: true, 
            users: {
              select: {
                first_name: true,
                last_name: true, 
              },
            },
          },
        },
      },
    });

    const enriched = pending.map((r) => {
      const teacher_name =
        r.courses?.users
          ? `${r.courses.users.first_name ?? ""} ${r.courses.users.last_name ?? ""}`.trim()
          : null;

      return {
        ...r,
        course_title: r.courses?.title ?? null,
        teacher_name,
      };
    });

    return res.json(enriched);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Server error" });
  }
};

/** ADMIN : Approuver une ressource => visible + statut Approved + notif Prof */
export const approveCourseResource = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const resourceId = Number(req.params.resourceId);
    if (!Number.isFinite(resourceId)) return res.status(400).json({ error: "Invalid resource id" });

    let approved = await prisma.resource_statuses.findUnique({ where: { name: "Approved" } });
    if (!approved) approved = await prisma.resource_statuses.create({ data: { name: "Approved" } });

    const resource = await prisma.course_resources.findUnique({
      where: { resource_id: resourceId },
      select: { resource_id: true, title: true, course_id: true, uploaded_by: true },
    });
    if (!resource) return res.status(404).json({ error: "Resource not found" });

    const updated = await prisma.course_resources.update({
      where: { resource_id: resource.resource_id },
      data: { is_visible: true, status_id: approved.status_id },
      select: { resource_id: true, is_visible: true, status_id: true },
    });

    // notif prof validé
    if (resource.uploaded_by) {
      try {
        const redirectLink = `/formateur/cours/${resource.course_id}?focus=${resource.resource_id}`;
        await sendNotificationEvent({
          userId: resource.uploaded_by,
          message: `Votre ressource "${resource.title ?? "Sans titre"}" a été validée.`,
          redirectLink,
        });
      } catch (e) {
        console.error("Notif prof (approve) KO:", e);
      }
    }

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Server error" });
  }
};

/**
 * Récupère le fichier binaire associé à une ressource
 * Accessible publiquement comme l'était /uploads auparavant.
 */
export const serveCourseResourceFile = async (req: Request, res: Response) => {
  try {
    const resourceId = Number(req.params.resourceId);
    if (!Number.isFinite(resourceId)) {
      return res.status(400).json({ error: "Invalid resource id" });
    }

    const resource = await prisma.course_resources.findUnique({
      where: { resource_id: resourceId },
      select: {
        resource_id: true,
        title: true,
        file_path: true,
        mime_type: true,
      },
    });

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    const storedFile = await prisma.resource_files.findUnique({
      where: { resource_id: resourceId },
      select: {
        data: true,
        original_name: true,
      },
    });

    if (!storedFile) {
      if (resource.file_path?.startsWith("/uploads/")) {
        const relative = resource.file_path.replace(/^\//, "");
        const absolutePath = path.join(process.cwd(), relative);
        if (fs.existsSync(absolutePath)) {
          if (resource.mime_type) res.type(resource.mime_type);
          return res.sendFile(absolutePath);
        }
      }
      return res.status(404).json({ error: "File content not found" });
    }

    const filename = storedFile.original_name || resource.title || `resource-${resource.resource_id}`;
    res.setHeader("Content-Type", resource.mime_type ?? "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(filename)}"`);
    res.setHeader("Content-Length", storedFile.data.length.toString());

    return res.send(Buffer.from(storedFile.data));
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Server error" });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;

    // Seul un admin peut supprimer un module
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const course = await prisma.courses.findUnique({
      where: { course_id: Number(id) },
    });

    if (!course) return res.status(404).json({ error: "Course not found" });

    
    
    
    // Supprimer d'abord les ressources liées, puis le cours dans une transaction
    await prisma.$transaction([
      prisma.course_resources.deleteMany({
        where: { course_id: Number(id) },
      }),
      prisma.courses.delete({
        where: { course_id: Number(id) },
      }),
    ]);


    res.json({ message: "Course deleted successfully" });
  } catch (err: any) {
    
    res.status(500).json({ error: err.message });
  }
};



/**
 * ADMIN : Modifier un module existant
 */
export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const { id } = req.params;
    const { title, description, teacher_id, start_date, credits, course_type, formation_id } = req.body;

    let parsedFormationId: number | undefined;
    if (formation_id !== undefined) {
      parsedFormationId = Number(formation_id);
      if (!Number.isFinite(parsedFormationId)) {
        return res.status(400).json({ error: "Invalid formation_id" });
      }
    }

    const course = await prisma.courses.findUnique({
      where: { course_id: Number(id) },
    });

    if (!course) return res.status(404).json({ error: "Course not found" });

    if (parsedFormationId !== undefined) {
      const formation = await prisma.formations.findUnique({
        where: { formation_id: parsedFormationId },
        select: { formation_id: true },
      });

      if (!formation) {
        return res.status(404).json({ error: "Formation not found" });
      }
    }

    const updatedCourse = await prisma.$transaction(async (tx) => {
      if (parsedFormationId !== undefined) {
        await tx.formation_courses.deleteMany({ where: { course_id: Number(id) } });
        await tx.formation_courses.create({
          data: {
            course_id: Number(id),
            formation_id: parsedFormationId,
          },
        });
      }

      await tx.courses.update({
        where: { course_id: Number(id) },
        data: {
          title,
          description,
          teacher_id: teacher_id ? Number(teacher_id) : null,
          start_date: start_date ? new Date(start_date) : null,
          credits: credits ? Number(credits) : null,
          course_type: course_type || null,
          updated_at: new Date(),
        },
      });

      return tx.courses.findUnique({
        where: { course_id: Number(id) },
        include: {
          users: { select: { first_name: true, last_name: true, email: true } },
          course_resources: true,
          formation_courses: {
            include: {
              formations: { select: { formation_id: true, title: true } },
            },
          },
        },
      });
    });

    res.json({ message: "Course updated successfully", course: updatedCourse });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCourseTeacher = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const courseId = Number(req.params.id);
    if (!Number.isFinite(courseId)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    // Vérifier la propriété (le cours doit appartenir à ce prof)
    const existing = await prisma.courses.findFirst({
      where: { course_id: courseId, teacher_id: req.user.id },
      select: { course_id: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "Course not found or not assigned to you" });
    }

    // Champs autorisés
    const { title, description } = req.body as {
      title?: string;
      description?: string | null;
    };

    const data: any = {};
    if (typeof title === "string") data.title = title.trim();
    if (description === null || typeof description === "string") {
      data.description = description ?? null;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const updated = await prisma.courses.update({
      where: { course_id: existing.course_id },
      data,
      select: {
        course_id: true,
        title: true,
        description: true,
        start_date: true,
        credits: true,
        course_type: true,
      },
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Server error" });
  }
};
/**
 * Étudiant : Liste des cours accessibles selon sa formation
 */
export const listStudentCourses = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const studentId = Number(req.params.id);
    if (Number.isNaN(studentId)) {
      return res.status(400).json({ error: "Invalid student id" });
    }

    if (req.user.role === "student" && req.user.id !== studentId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const registration = await prisma.registrations.findFirst({
      where: { student_id: studentId },
      orderBy: { registration_date: "desc" },
      select: {
        formation_id: true,
        formations: {
          select: {
            formation_id: true,
            title: true,
            description: true,
            mode: true,
            level: true,
          },
        },
      },
    });

    if (!registration) {
      return res.status(404).json({ error: "Aucune formation associée à cet étudiant." });
    }

    const courses = await prisma.courses.findMany({
      where: {
        formation_courses: {
          some: { formation_id: registration.formation_id },
        },
      },
      include: {
        course_resources: {
          where: { is_visible: true },          
          orderBy: { order_index: "asc" },      
        },
  users: { select: { first_name: true, last_name: true, email: true } },
},
      orderBy: { course_id: "asc" },
    });

    return res.json({
      formation: registration.formations ?? { formation_id: registration.formation_id },
      courses,
    });
  } catch (error: any) {
    console.error("Erreur listStudentCourses :", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

/**
 * Étudiant : Détail d’un cours accessible selon sa formation
 */
export const getStudentCourse = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const studentId = Number(req.params.studentId);
    const courseId = Number(req.params.courseId);

    if (Number.isNaN(studentId) || Number.isNaN(courseId)) {
      return res.status(400).json({ error: "Invalid identifiers" });
    }

    if (req.user.role === "student" && req.user.id !== studentId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const registration = await prisma.registrations.findFirst({
      where: { student_id: studentId },
      orderBy: { registration_date: "desc" },
      select: {
        formation_id: true,
        formations: {
          select: {
            formation_id: true,
            title: true,
            description: true,
            mode: true,
            level: true,
          },
        },
      },
    });

    if (!registration) {
      return res.status(404).json({ error: "Aucune formation associée à cet étudiant." });
    }

    const course = await prisma.courses.findFirst({
      where: {
        course_id: courseId,
        formation_courses: {
          some: { formation_id: registration.formation_id },
        },
      },
      include: {
        course_resources: {
          where: { is_visible: true },          
          orderBy: { order_index: "asc" },
        },
        users: { select: { first_name: true, last_name: true, email: true } },
      },
    });

    if (!course) {
      return res.status(404).json({ error: "Aucun cours correspondant pour cette formation." });
    }

    return res.json({
      formation: registration.formations ?? { formation_id: registration.formation_id },
      course,
    });
  } catch (error: any) {
    console.error("Erreur getStudentCourse :", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};
