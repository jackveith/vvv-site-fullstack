 import express from "express";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Example API route
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

// Start server
app.listen(4000, () => {
  console.log("API server running at http://localhost:4000");
});
