import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = process.env.PORT || 5555;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, () =>
    console.log(`Listening on port ${port}`),
);