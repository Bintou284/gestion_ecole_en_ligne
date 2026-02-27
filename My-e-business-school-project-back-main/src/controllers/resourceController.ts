import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../types/request.js";

// ADMIN valide ou rejette une ressource
export const validateResource = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params; 
    const { action } = req.body; 

    const resource = await prisma.course_resources.findUnique({
      where: { resource_id: Number(id) },
      include: { resource_statuses: true },
    });
    if (!resource) return res.status(404).json({ error: "Resource not found" });

    const status = await prisma.resource_statuses.findUnique({
      where: { name: action === "approve" ? "Approved" : "Rejected" },
    });
    if (!status) return res.status(500).json({ error: "Missing status" });

    const updated = await prisma.course_resources.update({
      where: { resource_id: resource.resource_id },
      data: {
        status_id: status.status_id,
        validated_by: req.user.id,
        validated_at: new Date(),
        is_visible: action === "approve",
      },
    });

    return res.json({ message: "Resource updated successfully", updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};