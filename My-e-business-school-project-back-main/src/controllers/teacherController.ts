import type { Response, Request} from "express";
import { validationResult } from "express-validator";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../types/request.js";

export const getAllTeachers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const teachers = await prisma.users.findMany({
      where: {
        user_roles: {
          some: {
            roles: {
              role_name: "teacher"
            }
          }
        }
      },
      include: {
        user_roles: {
          include: {
            roles: true
          }
        },
        formation_teachers: {
          include: {
            formations: true
          }
        },
        courses: {
          include: {
            formation_courses: {
              include: {
                formations: true
              }
            }
          }
        }
      }
    });

    const formattedTeachers = teachers.map(teacher => ({
      id: teacher.user_id,
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      email: teacher.email,
      phone: teacher.phone,
      address: teacher.address,
      postal_code: teacher.postal_code,
      city: teacher.city,
      specialite: teacher.courses[0]?.formation_courses[0]?.formations?.title || "Non spécifiée",
      dateEmbauche: teacher.created_at.toISOString().split('T')[0],
      statut: teacher.is_account_active ? 'actif' : 'inactif',
      formations: teacher.formation_teachers.map(ft => ft.formation_id)
    }));

    res.json(formattedTeachers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      address,
      postal_code,
      city,
      specialite, 
      dateEmbauche, 
      statut,
      formations 
    } = req.body;

    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: "Un utilisateur avec cet email existe déjà" });
    }

    const teacher = await prisma.users.create({
      data: {
        first_name,
        last_name,
        email,
        phone: phone || null,
        address: address || null,
        postal_code: postal_code || null,
        city: city || null,
        password_hash: "temp_password",
        is_account_active: false,
        created_at: new Date(dateEmbauche),
        user_roles: {
          create: {
            roles: {
              connect: {
                role_name: "teacher"
              }
            }
          }
        }
      },
      include: {
        user_roles: {
          include: {
            roles: true
          }
        }
      }
    });

    if (formations && formations.length > 0) {
      await prisma.formation_teachers.createMany({
        data: formations.map((formationId: number) => ({
          formation_id: formationId,
          teacher_id: teacher.user_id
        }))
      });
    }

    const formattedTeacher = {
      id: teacher.user_id,
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      email: teacher.email,
      phone: teacher.phone,
      address: teacher.address,
      postal_code: teacher.postal_code,
      city: teacher.city,
      specialite: specialite,
      dateEmbauche: teacher.created_at.toISOString().split('T')[0],
      statut: teacher.is_account_active ? 'actif' : 'inactif',
      formations: formations || []
    };

    res.status(201).json(formattedTeacher);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      address,
      postal_code,
      city,
      specialite, 
      dateEmbauche, 
      statut,
      formations 
    } = req.body;

    const existingTeacher = await prisma.users.findFirst({
      where: { 
        user_id: parseInt(id!),
        user_roles: {
          some: {
            roles: {
              role_name: "teacher"
            }
          }
        }
      }
    });

    if (!existingTeacher) {
      return res.status(404).json({ error: "Enseignant non trouvé" });
    }

    const updatedTeacher = await prisma.users.update({
      where: { user_id: parseInt(id!) },
      data: {
        first_name,
        last_name,
        email,
        phone: phone || null,
        address: address || null,
        postal_code: postal_code || null,
        city: city || null,
        is_account_active: statut === 'actif',
        created_at: new Date(dateEmbauche),
      }
    });

    if (formations) {
      await prisma.formation_teachers.deleteMany({
        where: { teacher_id: parseInt(id!) }
      });

      if (formations.length > 0) {
        await prisma.formation_teachers.createMany({
          data: formations.map((formationId: number) => ({
            formation_id: formationId,
            teacher_id: parseInt(id!)
          }))
        });
      }
    }

    const formattedTeacher = {
      id: updatedTeacher.user_id,
      first_name: updatedTeacher.first_name,
      last_name: updatedTeacher.last_name,
      email: updatedTeacher.email,
      phone: updatedTeacher.phone,
      address: updatedTeacher.address,
      postal_code: updatedTeacher.postal_code,
      city: updatedTeacher.city,
      specialite: specialite,
      dateEmbauche: updatedTeacher.created_at.toISOString().split('T')[0],
      statut: updatedTeacher.is_account_active ? 'actif' : 'inactif',
      formations: formations || []
    };

    res.json(formattedTeacher);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTeacher = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;

    const existingTeacher = await prisma.users.findFirst({
      where: { 
        user_id: parseInt(id!),
        user_roles: {
          some: {
            roles: {
              role_name: "teacher"
            }
          }
        }
      }
    });

    if (!existingTeacher) {
      return res.status(404).json({ error: "Enseignant non trouvé" });
    }

    await prisma.users.delete({
      where: { user_id: parseInt(id!) }
    });

    res.json({ message: "Enseignant supprimé avec succès" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getTeacherDetails = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;

    const teacher = await prisma.users.findFirst({
      where: { 
        user_id: parseInt(id!),
        user_roles: {
          some: {
            roles: {
              role_name: "teacher"
            }
          }
        }
      },
      include: {
        formation_teachers: {
          include: {
            formations: true
          }
        },
        courses: {
          include: {
            formation_courses: {
              include: {
                formations: true
              }
            },
            sessions: true
          }
        }
      }
    });

    if (!teacher) {
      return res.status(404).json({ error: "Enseignant non trouvé" });
    }

    const formattedTeacher = {
      id: teacher.user_id,
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      email: teacher.email,
      phone: teacher.phone,
      address: teacher.address,
      postal_code: teacher.postal_code,
      city: teacher.city,
      specialite: teacher.courses[0]?.formation_courses[0]?.formations?.title || "Non spécifiée",
      dateEmbauche: teacher.created_at.toISOString().split('T')[0],
      statut: teacher.is_account_active ? 'actif' : 'inactif',
      formations: teacher.formation_teachers.map(ft => ({
        id: ft.formation_id,
        nom: ft.formations.title
      })),
      cours: teacher.courses.map(course => ({
        id: course.course_id,
        titre: course.title,
        formation: course.formation_courses[0]?.formations?.title,
        duree: course.sessions.reduce((total, session) => {
          const duration = session.end_time.getTime() - session.start_time.getTime();
          return total + Math.round(duration / (1000 * 60 * 60));
        }, 0)
      }))
    };

    res.json(formattedTeacher);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Assignation d'un cours à un enseignant
export const assignerCours = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    const { course_id } = req.body;

    await prisma.courses.update({
      where: { course_id },
      data: { teacher_id: parseInt(id!) }
    });

    res.json({ message: "Cours assigné avec succès" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Retrait d'un cours à un enseignant
export const retirerCours = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { id, courseId } = req.params;

    await prisma.courses.update({
      where: { course_id: parseInt(courseId!) },
      data: { teacher_id: null }
    });

    res.json({ message: "Cours retiré avec succès" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


export const listTeachers = async (_req: Request, res: Response) => {
  try {
    const teachers = await prisma.users.findMany({
      where: {
        user_roles: {
          some: {
            roles: { role_name: "teacher" },
          },
        },
      },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
      },
    });
    res.json(teachers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


export const getTeacherStudents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    const teacherId = parseInt(id!);

    if (isNaN(teacherId)) {
      return res.status(400).json({ error: "ID professeur invalide" });
    }

    // Récupérer tous les étudiants inscrits aux formations 
    // qui contiennent des cours donnés par ce professeur
    const students = await prisma.users.findMany({
      where: {
        user_roles: {
          some: {
            roles: {
              role_name: "student"
            }
          }
        },
        // Récupérer les étudiants inscrits aux formations des cours du prof
        registrations: {
          some: {
            formations: {
              formation_courses: {
                some: {
                  courses: {
                    teacher_id: teacherId
                  }
                }
              }
            }
          }
        }
      },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
      },
      distinct: ['user_id'], 
    });

    res.json(students);
  } catch (err: any) {
    console.error("Erreur lors de la récupération des étudiants:", err);
    res.status(500).json({ 
      error: "Erreur lors de la récupération des étudiants",
      details: err.message 
    });
  }
};