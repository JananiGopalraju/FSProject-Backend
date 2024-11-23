

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));

// Setup file path handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Folder to store images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage });

// MongoDB connection
const uri = process.env.MONGODB_URI;
mongoose.connect(uri)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Define Movie schema
const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  genre: { type: String, required: true },
  releaseYear: { type: Number, required: true },
  images: { type: [String] }, // Array to store image URLs
});

const Movie = mongoose.model("Movie", movieSchema);

// Create a new movie with multiple images
app.post("/api/movies", upload.array("images", 5), async (req, res) => {
  const imageUrls = req.files.map((file) => `/uploads/${file.filename}`);

  const newMovie = new Movie({
    title: req.body.title,
    description: req.body.description,
    genre: req.body.genre,
    releaseYear: req.body.releaseYear,
    images: imageUrls,
  });

  try {
    const savedMovie = await newMovie.save();
    res.status(200).json(savedMovie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all movies
app.get("/api/movies", async (req, res) => {
  try {
    const limit = Number(req.query.limit);
    const movies = limit ? await Movie.find().limit(limit) : await Movie.find();
    res.status(200).json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get movie by ID
app.get("/api/movies/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    res.status(200).json(movie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update movie with optional new images
app.put("/api/movies/:id", upload.array("images", 10), async (req, res) => {
  const updateData = {
    title: req.body.title,
    description: req.body.description,
    genre: req.body.genre,
    releaseYear: req.body.releaseYear,
  };

  if (req.files && req.files.length > 0) {
    updateData.images = req.files.map((file) => `/uploads/${file.filename}`);
  }

  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (movie) {
      res.status(200).json(movie);
    } else {
      res.status(404).json("ID does not exist");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete movie and images
app.delete("/api/movies/:id", async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (movie) {
      movie.images.forEach((image) => {
        const imagePath = path.join(__dirname, image);
        fs.unlink(imagePath, (err) => {
          if (err) console.log("Error deleting file:", err);
        });
      });
      res.status(200).json(movie);
    } else {
      res.status(404).json("ID does not exist");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
