import { Router } from "express";
import {createCourse,listCourses,getCourse,uploadResource,deleteCourseResource,listPendingCourseResources,approveCourseResource,getCourseResourceById, updateCourseTeacher, getStudentCourse, listStudentCourses, serveCourseResourceFile} 
from "../controllers/courseController.js";
import { upload } from "../config/upload.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
import { createCourseValidator } from "../utils/validator.js";
import { deleteCourse } from "../controllers/courseController.js";
import { updateCourse } from "../controllers/courseController.js";

const router = Router();

// /** ADMIN — ressources en attente / validation */
router.get("/resources", authMiddleware, requireRole("admin"),listPendingCourseResources);
router.get("/resources/:resourceId", authMiddleware, requireRole("admin"),getCourseResourceById);
router.get("/resources/:resourceId/file", serveCourseResourceFile);
router.patch("/resources/:resourceId/approve", authMiddleware, requireRole("admin"), approveCourseResource);

//  Création d’un module 
router.post("/", authMiddleware, requireRole("admin"), createCourseValidator, createCourse);
router.patch("/:id", authMiddleware, requireRole("admin"), updateCourse);

router.patch("/:id", authMiddleware, requireRole("teacher"), updateCourseTeacher);

// Liste visible par les profs ET les admins
router.get("/", authMiddleware, requireRole("teacher", "admin"), listCourses);

// Détail d’un module visible par le prof assigné OU un admin
router.get("/:id", authMiddleware, requireRole("teacher", "admin"), getCourse);

//  Upload de fichier par le prof dans son module
router.post("/:id/upload", authMiddleware, requireRole("teacher"), upload.single("file"), uploadResource);


router.delete("/:id", authMiddleware, requireRole("admin"), deleteCourse);

// Liste des cours accessibles par un étudiant selon sa formation
router.get("/student/:id", authMiddleware, requireRole("student", "admin"), listStudentCourses);

// Détail d’un cours accessible à un étudiant selon sa formation
router.get(
  "/student/:studentId/course/:courseId",
  authMiddleware,
  requireRole("student", "admin"),
  getStudentCourse
);



export default router;
