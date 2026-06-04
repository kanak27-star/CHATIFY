import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser"
import cors from "cors"


import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js"

import { connectDB } from "./lib/db.js";

const app=express();
const PORT =process.env.PORT;

app.use(cors({
  origin: [process.env.CORS_ORIGIN || "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"],
  credentials: true, // allow frontend to send cookies
}));
app.use(express.json());
app.use(cookieParser());


app.use("/api/auth",authRoutes);
app.use("/api/users",userRoutes);
app.use("/api/chat",chatRoutes);

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();