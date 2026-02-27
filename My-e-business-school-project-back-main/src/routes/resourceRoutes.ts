import { Router } from "express";
import { validateResource } from "../controllers/resourceController.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.patch("/:id/validate", authMiddleware, requireRole("admin"), validateResource);

export default router;