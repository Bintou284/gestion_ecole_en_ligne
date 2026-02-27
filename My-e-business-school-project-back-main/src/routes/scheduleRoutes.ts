import { Router } from "express";
import {
  getStudentSchedule,
  getTeacherSchedule,
  listAllSlots,
  createSlot,
  updateSlot,
  deleteSlot,
} from "../controllers/scheduleController.js";

import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// --- Étudiant ---
router.get("/student/:id", authMiddleware, getStudentSchedule);

// --- Professeur ---
router.get("/teacher/:id", authMiddleware, getTeacherSchedule);

// --- Admin ---
router.get("/all", authMiddleware, requireRole("admin"), listAllSlots);
router.post("/", authMiddleware, requireRole("admin"), createSlot);
router.patch("/:id", authMiddleware, requireRole("admin"), updateSlot);
router.delete("/:id", authMiddleware, requireRole("admin"), deleteSlot);

export default router;