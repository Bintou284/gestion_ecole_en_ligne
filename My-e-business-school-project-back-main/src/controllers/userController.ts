import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../types/request.js";

/**
 * Récupérer les informations d'un utilisateur par son ID
 */
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { userId } = req.params;
    const userIdNum = parseInt(userId!);

    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    const user = await prisma.users.findUnique({
      where: { user_id: userIdNum },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        postal_code: true,
        birth_date: true,
        birth_place: true,
        created_at: true,
        is_account_active: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Récupérer toutes les notes d'un étudiant
 */
export const getStudentGrades = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { studentId } = req.params;
    const studentIdNum = parseInt(studentId!);

    if (isNaN(studentIdNum)) {
      return res.status(400).json({ error: "ID étudiant invalide" });
    }

    const grades = await prisma.grades.findMany({
      where: {
        student_id: studentIdNum,
      },
      include: {
        courses: {
          select: {
            course_id: true,
            title: true,
            course_type: true,
          },
        },
      },
      orderBy: {
        graded_at: "desc",
      },
    });

    // Formater les données
    const formattedGrades = grades.map((grade) => ({
      grade_id: grade.grade_id,
      student_id: grade.student_id,
      course_id: grade.course_id,
      score: Number(grade.score),
      item_name: grade.item_name,
      item_type: grade.item_type,
      weight: Number(grade.weight),
      graded_at: grade.graded_at,
      courses: grade.courses,
    }));

    res.json(formattedGrades);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Liste des formateurs avec recherche et pagination
 */
export const listTeachers = async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string | undefined)?.trim() || "";
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt((req.query.limit as string) || "20", 10))
    );
    const skip = (page - 1) * limit;

    const where = {
      user_roles: { some: { role_id: 2 } },
      ...(search
        ? {
            OR: [
              { first_name: { contains: search, mode: "insensitive" as const } },
              { last_name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [teachers, total] = await Promise.all([
      prisma.users.findMany({
        where,
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
        orderBy: [{ last_name: "asc" }, { first_name: "asc" }],
        skip,
        take: limit,
      }),
      prisma.users.count({ where }),
    ]);

    res.json({
      page,
      limit,
      total,
      items: teachers,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};