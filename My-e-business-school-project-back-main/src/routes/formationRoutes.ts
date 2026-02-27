import { Router } from "express";
import {
  createFormation,
  listFormations,
  getFormationById,
  updateFormation,
  deleteFormation,
  getFormationTeachers,
  syncFormationTeachers,
  getAllFormations,
  getAllCoursesWithRelations,
} from "../controllers/formationController.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", authMiddleware, requireRole("admin"), createFormation);
router.get("/", authMiddleware, getAllFormations);

router.get("/", authMiddleware, requireRole("admin"), listFormations);
router.get("/courses", authMiddleware, getAllCoursesWithRelations);

router.get("/:id", authMiddleware, requireRole("admin"), getFormationById);
router.put("/:id", authMiddleware, requireRole("admin"), updateFormation);
router.delete("/:id", authMiddleware, requireRole("admin"), deleteFormation);

router.get("/:id/teachers", authMiddleware, requireRole("admin"), getFormationTeachers);
router.put("/:id/teachers", authMiddleware, requireRole("admin"), syncFormationTeachers);


export default router;