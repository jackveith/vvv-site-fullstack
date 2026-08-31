import express from "express";
import cors from "cors";

import systemsRouter from "./routes/systems.js";
import starLanesRouter from "./routes/starlanes.js";
import shipsRouter from "./routes/ships.js";

const PORT = process.env.PORT || 4000;
const app = express();

// Middleware and Router
app.use(cors());
app.use(express.json());
app.use("/api/systems", systemsRouter);
app.use("/api/starlanes", starLanesRouter);
app.use("/api/ships", shipsRouter);

// Example API route
app.get("/api/hello", (req, res) => {
    res.json({ message: "...?" });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
