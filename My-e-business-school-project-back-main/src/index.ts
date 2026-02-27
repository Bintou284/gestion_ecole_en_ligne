import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

// routes existantes
import authRouter from "./routes/auth.js";
import courseRouter from "./routes/courseRoutes.js";
import studentProfileRouter from "./routes/studentProfileRoutes.js";
import teacherRouter from "./routes/teacherRoute.js";
import formationsRouter from "./routes/formationRoutes.js";
import emailRouter from "./routes/emailRoutes.js";
import activateRouter from "./routes/activateRoutes.js";
import statusRouter from "./routes/statusRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import studentDocumentsRouter from "./routes/studentDocumentsRoutes.js";
import scheduleRouter from "./routes/scheduleRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import bankDetailsRoutes from "./routes/bankDetailsRoutes.js";

import teacherCourseRoutes from "./routes/teacherCourseRoutes.js";

const app = express();

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());

// ---- MONTAGE DES ROUTES ----
// Auth & Users
app.use("/api/auth", authRouter);
app.use("/api/teachers", teacherRouter);
app.use("/api/users", userRoutes);

// Cours (ancien contrôleur, utilisé par ton collègue)
app.use("/api/courses", courseRouter);


app.use("/api/teacher/courses", teacherCourseRoutes);

// Étudiant / Formations / etc.
app.use("/api/studentProfiles", studentProfileRouter);
app.use("/api/formations", formationsRouter);
app.use("/api/teachers", teacherRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/api/email", emailRouter);
app.use("/api/active", activateRouter);
app.use("/api/userstatus", statusRouter);
app.use("/api/profile", profileRoutes);
app.use("/api/profile/profileRoutes", profileRoutes);

// Documents / Resources
app.use("/api/studentProfiles", studentDocumentsRouter);
app.use("/api/resources", resourceRoutes);

// Notifications
app.use("/api/notifications", notificationRoutes);
app.use("/api", bankDetailsRoutes);

// --- Error Handler  --
app.use((err: any, _req: any, res: any, _next: any) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Health & statics
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const PORT = process.env.PORT || 3000;
const PUBLIC_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
app.listen(PORT, () => console.log("API running on", PUBLIC_URL));
