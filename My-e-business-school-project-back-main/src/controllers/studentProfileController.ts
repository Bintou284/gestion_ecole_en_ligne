import type { Response } from "express";
import type { AuthRequest } from "../types/request.js";
import { validationResult } from "express-validator";
import prisma from "../config/prisma.js";

const parseBoolean = (value: any) => {
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return undefined;
};

const cleanData = (obj: Record<string, any>) =>
  Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));

const parseIntOrUndefined = (value: any) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? undefined : parsed;
};

// Crée un profil étudiant
export const createStudentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });


    const body = req.body;


    // 1. On récupère l'ID de la formation à partir de son titre
    let formationId: number | undefined = undefined;
    if (body.desired_program) {
      const formation = await prisma.formations.findFirst({
        where: { title: body.desired_program },
      });
      if (formation) formationId = formation.formation_id;
  }

    //Conversion automatique des types
    const data = {
      situation: body.situation,
      desired_program: body.desired_program,
      desired_start_date: body.desired_start_date ? new Date(body.desired_start_date) : undefined,
      handicap: parseBoolean(body.handicap),
      highest_degree: body.highest_degree,
      degree_name: body.degree_name,
      english_level: body.english_level,
      professional_project: body.professional_project,
      five_year_vision: body.five_year_vision,
      desired_jobs: body.desired_jobs,
      interests: body.interests,
      professional_experience: body.professional_experience,
      hobbies: body.hobbies,
      qualities: body.qualities,
      weaknesses: body.weaknesses,
      company_type_preference: body.company_type_preference,
      mobility_zone: body.mobility_zone,
      found_apprenticeship: parseBoolean(body.found_apprenticeship),
      apprenticeship_leads: body.apprenticeship_leads,
      prior_online_courses: parseBoolean(body.prior_online_courses),
      online_experience: body.online_experience,
      learning_preference: body.learning_preference,
      comfort_virtual_campus: body.comfort_virtual_campus,
      has_computer: parseBoolean(body.has_computer),
      internet_quality: body.internet_quality,
      previous_technical_issues: parseBoolean(body.previous_technical_issues),
      quiet_study_space: parseBoolean(body.quiet_study_space),
      self_evaluation_virtual_campus: parseIntOrUndefined(body.self_evaluation_virtual_campus),
      program_expectation_rating: parseIntOrUndefined(body.program_expectation_rating),
      financing_preference: body.financing_preference,
      guarantee_place: parseBoolean(body.guarantee_place),
      resume: body.resume,
      email: body.email,
      address: body.address,
      birth_date: body.birth_date ? new Date(body.birth_date) : undefined,
      birth_place: body.birth_place,
      city: body.city,
      first_name: body.first_name,
      last_name: body.last_name,
      phone: body.phone,
      postal_code: body.postal_code,
      cv_file_path: body.cv_file_path,
      formation_id: formationId,
    };

    

    const profile = await prisma.student_profiles.create({
  data: cleanData(data),
});
    return res.status(201).json(profile);
  } catch (err: any) {
    console.error("createStudentProfile error:", err);
    return res.status(500).json({ error: err.message });
  }
  
};

export const getStudentProfiles = async (_req: AuthRequest, res: Response) => {
  try {
    const profiles = await prisma.student_profiles.findMany({
      orderBy: { profile_id: "asc" },
    });
    return res.status(200).json(profiles);
  } catch (err: any) {
    console.error("getStudentProfiles error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const deleteStudentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID du profil manquant" });
    }

    //  Vérifie si le profil existe avant suppression
    const existingProfile = await prisma.student_profiles.findUnique({
      where: { profile_id: Number(id) },
    });

    if (!existingProfile) {
      return res.status(404).json({ error: "Profil non trouvé" });
    }

    //  Supprime le user associé 
    if (existingProfile.email) {
      await prisma.users.deleteMany({
        where: { email: existingProfile.email },
      });
    }

    // Supprime ensuite le profil étudiant
    await prisma.student_profiles.delete({
      where: { profile_id: Number(id) },
    });

    return res
      .status(200)
      .json({ message: "Profil étudiant et utilisateur associé supprimés avec succès." });
  } catch (err: any) {
    console.error("deleteStudentProfile error:", err);
    return res.status(500).json({ error: err.message });
  }
};




export const updateStudentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingProfile = await prisma.student_profiles.findUnique({
      where: { profile_id: Number(id) },
    });

    if (!existingProfile) {
      return res.status(404).json({ error: "Profil non trouvé" });
    }

    // Convertir types correctement
    const data = {
      situation: req.body.situation,
      desired_program: req.body.desired_program,
      desired_start_date: req.body.desired_start_date ? new Date(req.body.desired_start_date) : undefined,
      handicap: req.body.handicap === "true",
      highest_degree: req.body.highest_degree,
      degree_name: req.body.degree_name,
      english_level: req.body.english_level,
      professional_project: req.body.professional_project,
      five_year_vision: req.body.five_year_vision,
      desired_jobs: req.body.desired_jobs,
      interests: req.body.interests,
      professional_experience: req.body.professional_experience,
      hobbies: req.body.hobbies,
      qualities: req.body.qualities,
      weaknesses: req.body.weaknesses,
      company_type_preference: req.body.company_type_preference,
      mobility_zone: req.body.mobility_zone,
      found_apprenticeship: req.body.found_apprenticeship === "true",
      apprenticeship_leads: req.body.apprenticeship_leads,
      prior_online_courses: req.body.prior_online_courses === "true",
      online_experience: req.body.online_experience,
      learning_preference: req.body.learning_preference,
      comfort_virtual_campus: req.body.comfort_virtual_campus,
      has_computer: req.body.has_computer === "true",
      internet_quality: req.body.internet_quality,
      previous_technical_issues: req.body.previous_technical_issues === "true",
      quiet_study_space: req.body.quiet_study_space === "true",
      self_evaluation_virtual_campus: parseInt(req.body.self_evaluation_virtual_campus),
      program_expectation_rating: parseInt(req.body.program_expectation_rating),
      financing_preference: req.body.financing_preference,
      guarantee_place: req.body.guarantee_place === "true",
      resume: req.body.resume,
      email: req.body.email,
      address: req.body.address,
      birth_date: req.body.birth_date ? new Date(req.body.birth_date) : undefined,
      birth_place: req.body.birth_place,
      city: req.body.city,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      phone: req.body.phone,
      postal_code: req.body.postal_code,
      cv_file_path: req.body.cv_file_path,
    };

    const updatedProfile = await prisma.student_profiles.update({
      where: { profile_id: Number(id) },
      data: cleanData(data),
    });

    res.status(200).json(updatedProfile);
  } catch (err: any) {
    console.error("updateStudentProfile error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getFilteredStudentProfiles = async (req: AuthRequest, res: Response) => {
  try {
    const { program, city, finance} = req.query;

    const filters: any = {};
    if (program) filters.desired_program = program;
    if (city) filters.city = city;
    if (finance) filters.financing_preference = finance;

    const profiles = await prisma.student_profiles.findMany({
      where: filters,
      orderBy: { profile_id: "asc" },
    });

    return res.status(200).json(profiles);
  } catch (err: any) {
    console.error("getFilteredStudentProfiles error:", err);
    return res.status(500).json({ error: err.message });
  }
};