import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { adminSubmissionsRouter } from "./routes/adminSubmissions.js";

export const app = express();

const allowedOrigins = new Set([
  env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://kadel-kouture-frontend.vercel.app"
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS origin not allowed"));
    },
  }),
);
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/admin", adminSubmissionsRouter);

app.use((_request, response) => {
  response.status(404).json({ message: "Route not found" });
});
