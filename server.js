// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const uri = process.env.MONGODB_URI;

mongoose
  .connect(uri)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });


  // creating a model named "movie"
const movieSchema = new mongoose.Schema({
    course: { type: String, required: true},
    description: { type: String, required: true},
  });
   const Movie = mongoose.model("Movie", movieSchema);


   // creating a new movie and posting it in model "movie"
  app.post("/api/movies", async (req, res) => {
    const newMovie = new Movie ({
      course : req.body.course,
      description : req.body.description,
    });
    
    try {
      const savedMovies = await newMovie.save();
      res.status(200).json(savedMovies);
    }
    catch (err) {
      res.status(400).json({ message: "ERROR creating new movie"});
    }
  });


  // getting all movies or limiting them
  app.get("/api/movies", async (req, res) => {
    try {
      const limit = Number(req.query.limit);
      const movies = limit ? await Movie.find().limit(limit) : await Movie.find();
      res.status(200).json(movies);
    }
    catch (error) {
      res.status(400).json({ message: "Error fetching movies", error });
    }
  });



// -----------------------------------------------------------------------------------

//  // creating a new post and posting it in model "post"
//  app.post("/api/posts", async (req, res) => {
//   const newPost = new Post ({
//     course : req.body.course,
//     description : req.body.description,
//   });
  
//   try {
//     const savedPosts = await newPost.save();
//     res.status(200).json(savedPosts);
//   }
//   catch (err) {
//     res.status(400).json({ message: "ERROR creating new movie"});
//   }
// });


// // getting all posts or limiting them
// app.get("/api/posts", async (req, res) => {
//   try {
//     const limit = Number(req.query.limit);
//     const posts = limit ? await Post.find().limit(limit) : await Post.find();
//     res.status(200).json(posts);
//   }
//   catch (error) {
//     res.status(400).json({ message: "Error fetching posts", error });
//   }
// });









// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

