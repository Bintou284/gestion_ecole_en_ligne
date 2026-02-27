//routes/auth.routes.ts
import { Router } from "express";
import { activateAccount } from "../controllers/activateController.js";

const router = Router();

router.post("/activate", activateAccount);

export default router;