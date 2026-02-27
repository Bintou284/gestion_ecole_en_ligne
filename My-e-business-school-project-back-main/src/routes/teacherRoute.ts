

import express from "express";
import {
  getAllTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherDetails,
  assignerCours,
  retirerCours,
  getTeacherStudents
} from "../controllers/teacherController.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
 import { listTeachers } from "../controllers/teacherController.js";


const router = express.Router();
router.get("/teachers", authMiddleware, requireRole("admin"), listTeachers);

router.get("/", authMiddleware, getAllTeachers);
router.get("/:id", authMiddleware, getTeacherDetails);

router.get("/:id/students", authMiddleware, getTeacherStudents);
router.post("/", authMiddleware, createTeacher);
router.put("/:id", authMiddleware, updateTeacher);
router.delete("/:id", authMiddleware, deleteTeacher);
router.post("/:id/courses", authMiddleware, assignerCours);
router.delete("/:id/courses/:courseId", authMiddleware, retirerCours);

export default router;