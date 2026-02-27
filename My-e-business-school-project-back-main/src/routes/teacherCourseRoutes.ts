import { Router } from "express";
import { upload } from "../config/upload.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
import {
  listTeacherCourses,
  getTeacherCourse,
  updateTeacherCourse,
  uploadTeacherResource,
  deleteTeacherResource,
} from "../controllers/teacherCourseController.js";

const router = Router();

router.get("/", authMiddleware, requireRole("teacher"), listTeacherCourses);
router.get("/:id", authMiddleware, requireRole("teacher"), getTeacherCourse);
router.patch("/:id", authMiddleware, requireRole("teacher"), updateTeacherCourse);
router.post("/:id/upload", authMiddleware, requireRole("teacher"), upload.single("file"), uploadTeacherResource);
router.delete("/:id/resources/:resourceId", authMiddleware, requireRole("teacher"), deleteTeacherResource);

export default router;
