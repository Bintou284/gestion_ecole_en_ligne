import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../types/request.js";
import { notifyUsers } from "../services/notificationProducer.js";

/**
 * Récupérer le planning d’un étudiant (par formation)
 */
export const getStudentSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = Number(req.params.id);

    // récupérer la formation de l'étudiant
    const registration = await prisma.registrations.findFirst({
      where: { student_id: studentId },
    });

    if (!registration)
      return res.status(404).json({ error: "L'étudiant n'est inscrit à aucune formation." });

    // récupérer les créneaux liés à cette formation
    const slots = await prisma.schedule_slots.findMany({
      where: { formation_id: registration.formation_id },
      include: {
        courses: true,
        users_schedule_slots_teacher_idTousers: true,
      },
      orderBy: { start_time: "asc" },
    });

    res.json(slots);
  } catch (error) {
    console.error("Erreur getStudentSchedule :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

/**
 *  Récupérer le planning d’un professeur
 */
export const getTeacherSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = Number(req.params.id);

    const slots = await prisma.schedule_slots.findMany({
      where: { teacher_id: teacherId },
      include: {
        courses: true,
        formations: true,
      },
      orderBy: { start_time: "asc" },
    });

    res.json(slots);
  } catch (error) {
    console.error("Erreur getTeacherSchedule :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

/**
 * Admin - Récupérer tous les créneaux
 */
export const listAllSlots = async (_req: Request, res: Response) => {
  try {
    const slots = await prisma.schedule_slots.findMany({
      include: {
        courses: true,
        formations: true,
        users_schedule_slots_teacher_idTousers: true, 
        users_schedule_slots_created_by_idTousers: true, 
      },
      orderBy: { start_time: "asc" },
    });
    res.json(slots);
  } catch (error) {
    console.error("Erreur listAllSlots :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

/**
 * Admin - Créer un créneau
 */
export const createSlot = async (req: AuthRequest, res: Response) => {
  try {
    const { course_id, formation_id, teacher_id, start_time, end_time, room } = req.body;
    const adminId = req.user?.id; 

    if (!start_time || !end_time)
      return res.status(400).json({ error: "Les champs start_time et end_time sont obligatoires." });

    const slot = await prisma.schedule_slots.create({
      data: {
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        updated_at: new Date(), 
        course_id: course_id ? Number(course_id) : null,
        formation_id: formation_id ? Number(formation_id) : null,
        teacher_id: teacher_id ? Number(teacher_id) : null,
        room: room ?? null,
        created_by_id: adminId ?? null,
      },
    });

    await notifySlotChange(
      slot,
      `Un nouveau créneau vous a été attribué le ${slot.start_time} (salle: ${room || '?'})`,
      `Un nouveau créneau a été ajouté dans votre planning formation le ${slot.start_time} (salle: ${room || '?'})`
    );

    res.status(201).json(slot);
  } catch (error) {
    console.error("Erreur createSlot :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

/**
 * Admin - Modifier un créneau
 */
export const updateSlot = async (req: AuthRequest, res: Response) => {
  try {
    const slotId = Number(req.params.id);
    const { course_id, formation_id, teacher_id, start_time, end_time, room } = req.body;

    const dataToUpdate = {
      course_id: course_id ? Number(course_id) : (course_id === null ? null : undefined),
      formation_id: formation_id ? Number(formation_id) : (formation_id === null ? null : undefined),
      teacher_id: teacher_id ? Number(teacher_id) : (teacher_id === null ? null : undefined),
      start_time: start_time ? new Date(start_time) : undefined,
      end_time: end_time ? new Date(end_time) : undefined,
      room: room !== undefined ? room : undefined,
      updated_at: new Date(), 
    };

    const slot = await prisma.schedule_slots.update({
      where: { slot_id: slotId },
      data: Object.fromEntries(Object.entries(dataToUpdate).filter(([_, v]) => v !== undefined)),
    });

    await notifySlotChange(
      slot,
      `Votre créneau du ${slot.start_time} a été modifié.`,
      `Un créneau de votre formation du ${slot.start_time} a été modifié.`   
     );

    res.json(slot);
  } catch (error) {
    console.error("Erreur updateSlot :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

/**
 * Admin - Supprimer un créneau
 */
export const deleteSlot = async (req: AuthRequest, res: Response) => {
  try {
    const slotId = Number(req.params.id);

    const slot = await prisma.schedule_slots.findUnique({ where: { slot_id: slotId } });
    if (!slot) return res.status(404).json({ error: "Ce créneau n'existe pas." });

    await prisma.schedule_slots.delete({
      where: { slot_id: slotId },
    });

    // Notifier le professeur et etudiants concernés
    await notifySlotChange(
      slot,
      `Un créneau (date: ${slot.start_time}) a été supprimé de votre planning.`,
      `Un créneau (date: ${slot.start_time}) a été supprimé de votre planning formation.`,
    );


    res.json({ message: "Créneau supprimé avec succès." });
  } catch (error) {
    console.error("Erreur deleteSlot :", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

// Helper pour récupérer les étudiants d'une formation 
async function getStudentsForFormation(formationId: number) {
  const registrations = await prisma.registrations.findMany({
    where: { formation_id: formationId },
    select: { users: { select: { user_id: true } }, student_id: true }
  });
  return registrations.filter(r => r.users).map(r => r.users);
}


/**
 * Factorise la notification sur un slot (créneau) : prof + étudiants
 * messageProf et messageEtudiants sont les textes personnalisés à afficher
 * teacherLink/studentLink : liens frontend ciblés 
 */
export async function notifySlotChange(
  slot: { teacher_id?: number | null, formation_id?: number | null, start_time: string | Date },
  messageProf: string,
  messageEtudiants: string,
): Promise<void> {
  // Professeur
  if (slot.teacher_id) {
    await notifyUsers([
      { user_id: Number(slot.teacher_id) }
    ], messageProf, `/formateur/planning`);
  }
  // Étudiants
  if (slot.formation_id) {
    const students = await getStudentsForFormation(Number(slot.formation_id));
    for (const student of students) {
      await notifyUsers(
        [student],
        messageEtudiants, 
        `/etudiant/calendrier`
      );
    }  }
}