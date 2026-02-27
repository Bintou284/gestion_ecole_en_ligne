import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createStudentProfile, getStudentProfiles } from "../controllers/studentProfileController.js";
import { authStub } from "../middleware/authMiddleware.js";
import { createStudentProfileValidator } from "../middleware/validation.js";
import { deleteStudentProfile, updateStudentProfile} from "../controllers/studentProfileController.js";
import { getFilteredStudentProfiles} from "../controllers/studentProfileController.js";
const router = Router();

// --- CONFIGURATION DU STOCKAGE POUR LES CV ---
const uploadDir = "uploads/cv";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// --- ROUTES ---
router.post(
  "/",
  authStub,
  upload.single("cv_file"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.file) {
      req.body.cv_file_path = `/uploads/cv/${req.file.filename}`;
    }
    next();
  },
  createStudentProfileValidator,
  createStudentProfile
);


router.get("/filtered", authStub, getFilteredStudentProfiles);
router.get("/", authStub, getStudentProfiles);
router.delete("/:id", deleteStudentProfile);
router.put(
  "/:id",
  authStub,
  upload.single("cv_file"),  
  (req: Request, res: Response, next: NextFunction) => {
    if (req.file) {
      req.body.cv_file_path = `/uploads/cv/${req.file.filename}`;
    }
    next();
  },
  updateStudentProfile
);

export default router;

