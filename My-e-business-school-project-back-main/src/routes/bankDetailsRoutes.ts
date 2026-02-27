import { Router } from "express";
import {
  updateBankDetails,
  getOwnBankDetails,
} from "../controllers/bankDetailsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/bank-details", authMiddleware, getOwnBankDetails);
router.put("/bank-details", authMiddleware, updateBankDetails);



export default router;
