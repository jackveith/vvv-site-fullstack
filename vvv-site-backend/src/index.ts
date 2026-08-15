import express from "express";
import cors from "cors";

import systemsRouter from "./routes/systems.js";



//deprecated moved to db.ts
//import { PrismaClient } from './generated/prisma/index.js'
//import { withAccelerate } from '@prisma/extension-accelerate'
//const prisma_db_url = `${process.env.DATABASE_URL}`;
//const prisma = new PrismaClient().$extends(withAccelerate())

const PORT = process.env.PORT || 4000;

const app = express();

// Middleware and Router
app.use(cors());
app.use(express.json());
app.use("/api/systems", systemsRouter);

// Example API route
app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from Express!" });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
