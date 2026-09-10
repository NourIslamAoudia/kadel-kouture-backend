import type { NextFunction, Request, Response } from "express";
import type { User } from "@supabase/supabase-js";
import { supabaseAuth } from "../lib/supabase.js";

declare global {
  namespace Express {
    interface Request {
      adminUser?: User;
    }
  }
}

function isAdmin(user: User) {
  const appMetadata = user.app_metadata ?? {};
  const userMetadata = user.user_metadata ?? {};
  return (
    appMetadata.role === "admin" ||
    appMetadata.is_admin === true ||
    appMetadata.is_admin === "true" ||
    userMetadata.role === "admin" ||
    userMetadata.is_admin === true ||
    userMetadata.is_admin === "true"
  );
}

export async function requireAdmin(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const authorization = request.header("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!token) {
    response.status(401).json({ message: "Missing bearer token" });
    return;
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) {
    response.status(401).json({ message: "Invalid or expired token" });
    return;
  }

  if (!isAdmin(data.user)) {
    response.status(403).json({ message: "Administrator access required" });
    return;
  }

  request.adminUser = data.user;
  next();
}
