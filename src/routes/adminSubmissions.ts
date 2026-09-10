import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const querySchema = z.object({
  status: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const statusSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
});

export const adminSubmissionsRouter = Router();

adminSubmissionsRouter.get(
  "/submissions",
  requireAdmin,
  async (request, response) => {
    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      response.status(400).json({
        message: "Invalid query parameters",
        issues: parsed.error.issues,
      });
      return;
    }

    const { status, limit, offset } = parsed.data;
    let query = supabaseAdmin
      .from("submissions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) {
      response.status(500).json({ message: "Unable to load submissions" });
      return;
    }

    response.json({ data, count: count ?? 0, limit, offset });
  },
);

adminSubmissionsRouter.patch(
  "/submissions/:id/status",
  requireAdmin,
  async (request, response) => {
    const parsed = statusSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ message: "Invalid status" });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from("submissions")
      .update({ status: parsed.data.status })
      .eq("id", request.params.id)
      .select("*")
      .single();

    if (error) {
      response.status(500).json({ message: "Unable to update submission" });
      return;
    }

    response.json(data);
  },
);
