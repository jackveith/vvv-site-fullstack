import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion, Db } from "mongodb";
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const prisma_db_url = `${process.env.DATABASE_URL}`;

const app = express();
const prisma = new PrismaClient().$extends(withAccelerate())

// Middleware
app.use(cors());
app.use(express.json());

// Example API route
app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from Express!" });
});

