import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion, Db } from "mongodb";


const app = express();

const uri = `${process.env.DATABASE_URI}`;
let db: Db;

async function connectDB() {
    const client = new MongoClient (uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });
    await client.connect();
    db = client.db("vvv-fullstack-db-main");
    console.log("Connected to MongoDB.");

}

// Middleware
app.use(cors());
app.use(express.json());

// Example API route
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express!" });
});


app.get("/ping", (req, res) => {
  res.json({message:"ping test succeeded. And, good day :)"});
});


app.get("/user/:name", async (req, res) => {
    
    try {
        const name = req.params.name;

        const result = await db
            .collection("Users")
            .findOne({ name: name });

        if (!result) {
            return res.status(404).json({ message: "User not found." });
        }

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Internal server error."});
    }
});


// Start server
connectDB().then(() => {
    app.listen(4000, () => {
        console.log("API server running at http://localhost:4000");
    });
});
