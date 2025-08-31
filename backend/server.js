// ===== IMPORTS =====
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
require('dotenv').config(); // Load environment variables from .env file

// ===== SETUP =====
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ===== LOAD RECIPES DATA =====
const recipesData = require("./data/recipes.json");

// ===== HELPER FUNCTIONS =====
const favoritesFilePath = path.join(__dirname, 'data', 'favorites.json');
const ratingsFilePath = path.join(__dirname, 'data', 'ratings.json');

function readJSONFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

function writeJSONFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    return false;
  }
}

// ===== ROUTES =====
app.get("/", (req, res) => {
  res.send("✅ Smart Recipe Backend is running. Use /api/recipes etc.");
});

// Fetch recipes with filters
app.get("/api/recipes", (req, res) => {
  const { difficulty, maxTime, ingredients, diet } = req.query;
  let filteredRecipes = [...recipesData.recipes];

  if (difficulty) filteredRecipes = filteredRecipes.filter(r => r.difficulty.toLowerCase() === difficulty.toLowerCase());
  if (maxTime) filteredRecipes = filteredRecipes.filter(r => r.time <= parseInt(maxTime));
  if (diet) filteredRecipes = filteredRecipes.filter(r => r.dietTags && r.dietTags.includes(diet));

  if (ingredients) {
    const ingredientList = ingredients.split(",").map(i => i.trim().toLowerCase());
    filteredRecipes = filteredRecipes.filter(recipe => {
      const recipeIngredients = recipe.ingredients.map(i => i.name.toLowerCase());
      return ingredientList.every(ing => recipeIngredients.some(rIng => rIng.includes(ing) || ing.includes(rIng)));
    });
  }

  res.json({ recipes: filteredRecipes });
});

// Get recipe by ID
app.get("/api/recipes/:id", (req, res) => {
  const recipe = recipesData.recipes.find(r => String(r.id) === String(req.params.id));
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });
  res.json({ recipe });
});

// Save or remove recipe as favorite
app.post("/api/recipes/:id/save", (req, res) => {
  const recipeId = String(req.params.id);
  const recipe = recipesData.recipes.find(r => String(r.id) === recipeId);
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });

  let favoritesData = readJSONFile(favoritesFilePath);
  if (!favoritesData) favoritesData = { favorites: [] };

  const existingIndex = favoritesData.favorites.findIndex(r => String(r.id) === recipeId);
  if (existingIndex === -1) {
    favoritesData.favorites.push({ ...recipe, saved: true });
    if (!writeJSONFile(favoritesFilePath, favoritesData)) {
      return res.status(500).json({ error: "Failed to save favorite" });
    }
    res.json({ message: "Recipe saved successfully", saved: true });
  } else {
    favoritesData.favorites.splice(existingIndex, 1);
    if (!writeJSONFile(favoritesFilePath, favoritesData)) {
      return res.status(500).json({ error: "Failed to remove favorite" });
    }
    res.json({ message: "Recipe removed from saved", saved: false });
  }
});

app.get("/api/saved-recipes", (req, res) => {
  let favoritesData = readJSONFile(favoritesFilePath);
  if (!favoritesData) favoritesData = { favorites: [] };
  res.json({ recipes: favoritesData.favorites });
});

// Rate a recipe
app.post("/api/recipes/:id/rate", (req, res) => {
  const recipeId = String(req.params.id);
  const { rating } = req.body;
  const recipe = recipesData.recipes.find(r => String(r.id) === recipeId);
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });
  if (rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be between 1 and 5" });

  let ratingsData = readJSONFile(ratingsFilePath);
  if (!ratingsData) ratingsData = { ratings: [] };

  const existingIndex = ratingsData.ratings.findIndex(r => String(r.id) === recipeId);
  if (existingIndex === -1) {
    ratingsData.ratings.push({ id: recipeId, rating });
  } else {
    ratingsData.ratings[existingIndex].rating = rating;
  }

  if (!writeJSONFile(ratingsFilePath, ratingsData)) {
    return res.status(500).json({ error: "Failed to save rating" });
  }

  res.json({ message: `Recipe rated ${rating} stars`, rating });
});

// Get all ratings
app.get("/api/ratings", (req, res) => {
  let ratingsData = readJSONFile(ratingsFilePath);
  if (!ratingsData) ratingsData = { ratings: [] };
  res.json({ ratings: ratingsData.ratings });
});

// ===== IMAGE UPLOAD & INGREDIENT RECOGNITION =====
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post('/api/recognize-ingredients', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imgPath = req.file.path;

    // Run predict.py
    const python = spawn("python", ["predict.py", imgPath]);

    let result = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    python.on("close", (code) => {
      // Delete uploaded file after processing
      fs.unlinkSync(imgPath);

      if (code !== 0) {
        console.error("Python error:", errorOutput);
        return res.status(500).json({ ingredient: null, error: "Failed to recognize ingredient, fallback used" });
      }

      res.json({ ingredient: result.trim() });
    });

  } catch (error) {
    console.error('Server error recognizing ingredient:', error);
    res.status(500).json({ ingredient: null, error: 'Failed to recognize ingredient' });
  }
});


// ===== RECOMMENDATION ENDPOINT =====
app.get("/api/recommendations", (req, res) => {
  // Simple recommendation logic: top rated recipes
  let ratingsData = readJSONFile(ratingsFilePath);
  if (!ratingsData) ratingsData = { ratings: [] };

  // Sort ratings descending
  const sortedRatings = ratingsData.ratings.sort((a, b) => b.rating - a.rating);

  // Get top 5 rated recipe IDs
  const topRatedIds = sortedRatings.slice(0, 5).map(r => r.id);

  // Find recipes matching top rated IDs
  const recommendedRecipes = recipesData.recipes.filter(r => topRatedIds.includes(String(r.id)));

  res.json({ recommendations: recommendedRecipes });
});

// ===== SUBSTITUTION SUGGESTIONS ENDPOINT =====
app.get("/api/recipes/:id/substitutions", (req, res) => {
  const recipeId = String(req.params.id);
  const recipe = recipesData.recipes.find(r => String(r.id) === recipeId);
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });

  // Example substitution suggestions (static for demo)
  const substitutions = recipe.ingredients.map(ingredient => ({
    original: ingredient.name,
    alternative: "Alternative for " + ingredient.name
  }));

  res.json({ substitutions });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
