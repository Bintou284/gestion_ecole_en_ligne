//routes/userRoutes.ts
import { Router } from "express";
import { getAccountStatus } from "../controllers/statusController.js";
import { authStub } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/account-status/:id", authStub, getAccountStatus);

export default router;