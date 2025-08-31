import React, { useState, useEffect } from 'react';
import './App.css';
import './AppStyles.css';
const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");


const App = () => {
  const [userIngredients, setUserIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('');
  const [servingSize, setServingSize] = useState(1);
  const [userDietaryPreference, setUserDietaryPreference] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);

  // New state for local rating to reflect immediately
  const [localRating, setLocalRating] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [recognizedIngredient, setRecognizedIngredient] = useState(null);

  const addIngredient = (ingredient) => {
    console.log('Adding ingredient:', ingredient);
    if (!ingredient) return;
    setUserIngredients(prevIngredients => {
      if (prevIngredients.includes(ingredient)) return prevIngredients;
      const newIngredients = [...prevIngredients, ingredient];
      console.log('New ingredients list:', newIngredients);
      return newIngredients;
    });
  };

  const removeIngredient = (index) => {
    const newIngredients = [...userIngredients];
    newIngredients.splice(index, 1);
    setUserIngredients(newIngredients);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
     const response = await fetch(`${API_BASE}/api/recognize-ingredients`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.ingredient) {
        setUserIngredients((prev) => [...prev, data.ingredient]); // ✅ FIXED
        setRecognizedIngredient(data.ingredient);
      }
      setUploadedImage(URL.createObjectURL(file));
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      // Build query parameters for the GET request
      const params = new URLSearchParams();
      if (userIngredients.length > 0) {
        params.append('ingredients', userIngredients.join(','));
      }
      if (difficultyFilter) {
        params.append('difficulty', difficultyFilter);
      }
      if (timeFilter) {
        params.append('maxTime', timeFilter);
      }
      if (userDietaryPreference) {
        params.append('diet', userDietaryPreference);
      }

      const response = await fetch(`${API_BASE}/api/recipes?${params.toString()}`);
      const data = await response.json();
      console.log("Fetched recipes from backend:", data);

      if (data.recipes) {
        setRecipes(data.recipes);
      } else {
        setRecipes([]);
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
    setLoading(false);
  };

  const saveRecipe = async (recipeId) => {
    try {
       const response = await fetch(`${API_BASE}/api/recipes/${recipeId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to save recipe');
      }
      
      const result = await response.json();
      
      // Update the recipe in the recipes list
      const updatedRecipes = recipes.map(recipe => 
        recipe.id === recipeId ? { ...recipe, saved: result.saved } : recipe
      );
      setRecipes(updatedRecipes);
      
      // Update favorites list
      if (result.saved) {
        const recipeToAdd = recipes.find(r => r.id === recipeId);
        if (recipeToAdd) {
          setFavorites([...favorites, { ...recipeToAdd, saved: true }]);
        }
      } else {
        setFavorites(favorites.filter(r => r.id !== recipeId));
      }
      
      // Show success message
      console.log(result.message);
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Failed to save recipe. Please try again.');
    }
  };

  const rateRecipe = async (recipeId, rating) => {
    try {
      const response = await fetch(`${API_BASE}/api/recipes/${recipeId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to rate recipe');
      }
      
      const result = await response.json();
      
      // Update the recipe in the recipes list
      const updatedRecipes = recipes.map(recipe => 
        recipe.id === recipeId ? { ...recipe, rating } : recipe
      );
      setRecipes(updatedRecipes);
      
      // Show success message
      console.log(result.message);
    } catch (error) {
      console.error('Error rating recipe:', error);
      alert('Failed to rate recipe. Please try again.');
    }
  };

  const viewRecipeDetails = (recipe) => {
    setSelectedRecipe(recipe);
  };

  const closeRecipeDetails = () => {
    setSelectedRecipe(null);
  };

  useEffect(() => {
    // Load favorites from backend
    const loadFavorites = async () => {
      try {
         const response = await fetch(`${API_BASE}/api/saved-recipes`);
        if (response.ok) {
          const data = await response.json();
          setFavorites(data.recipes);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };
    
    loadFavorites();
  }, []);

return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <a className="logo" href="#">
<img
  alt="Smart Recipe Generator logo, green stylized chef hat with SRG text"
  height="40"
  width="40"
  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA2NCA2NCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsPSJub25lIj4KICA8Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMCIgc3Ryb2tlPSIjNWNiMjcwIiBzdHJva2Utd2lkdGg9IjQiIGZpbGw9IiNhOGQyNmQiLz4KICA8cGF0aCBkPSJNMTAgNDAgTDMxIDIwIDQ0IDQwIFoiIGZpbGw9IiMzYTY3NDQiLz4KICA8dGV4dCB4PSIzMiIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtd2VpZ2h0PSJib2xkIj5TUkc8L3RleHQ+Cjwvc3ZnPgo="
/>
            <span>Smart Recipe Generator</span>
          </a>
          <nav className="main-nav">
            <a href="#input">Ingredients</a>
            <a href="#recipes">Recipes</a>
            <a href="#favorites">Favorites</a>
            <a href="#about">About</a>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {/* Ingredient Input Section */}
        <section className="section" id="input">
          <h2 className="section-title">Enter Your Ingredients</h2>
          <p className="section-description">
            Add the ingredients you have. Set your dietary preferences for customized recipe ideas.
          </p>
          <div className="input-section">
            {/* Ingredient Text Input and Selection */}
            <div className="input-group">
              <label className="input-label" htmlFor="ingredient-input">
                Add Ingredients
              </label>
              <div className="input-container">
                <input
                  className="text-input"
                  id="ingredient-input"
                  placeholder="Type ingredient and press Add"
                  type="text"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addIngredient(e.target.value.toLowerCase());
                      e.target.value = '';
                    }
                  }}
                />
                <button
                  className="btn"
                  onClick={(e) => {
                    const input = document.getElementById('ingredient-input');
                    addIngredient(input.value.toLowerCase());
                    input.value = '';
                  }}
                >
                  Add
                </button>
              </div>
              <div
                aria-live="polite"
                className="ingredients-list"
                id="ingredient-list"
              >
                {userIngredients.map((ingredient, index) => (
                  <span 
                    key={index} 
                    className="ingredient-tag"
                  >
                    <span>{ingredient}</span>
                    <button 
                      aria-label={`Remove ingredient ${ingredient}`}
                      className="remove-btn"
                      onClick={() => removeIngredient(index)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </span>
                ))}
              </div>
          </div>
          {/* Dietary Preferences */}
          <div className="input-group">
            <label className="input-label" htmlFor="dietary-select">
              Dietary Preferences
            </label>
            <select
              className="select"
              id="dietary-select"
              value={userDietaryPreference}
              onChange={(e) => setUserDietaryPreference(e.target.value)}
            >
              <option value="">None</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="gluten_free">Gluten-Free</option>
              <option value="dairy_free">Dairy-Free</option>
              <option value="keto">Keto</option>
              <option value="paleo">Paleo</option>
            </select>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ marginTop: '10px' }}
            />
            {uploadedImage && (
              <div style={{ marginTop: '10px' }}>
                <img
                  src={uploadedImage}
                  alt="Uploaded ingredient"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
                {recognizedIngredient && (
                  <p style={{ marginTop: '5px', fontWeight: 'bold' }}>
                    Recognized: {recognizedIngredient}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-8">
          <button
            className="btn"
            disabled={userIngredients.length === 0}
            onClick={fetchRecipes}
          >
            Generate Recipes
          </button>
        </div>
      </section>

        {/* Filters Section */}
        <section className="section" id="filters">
          <h2 className="section-title">Filter &amp; Customize Recipes</h2>
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label" htmlFor="filter-difficulty">Difficulty</label>
              <select
                className="select"
                id="filter-difficulty"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label" htmlFor="filter-time">Max Cooking Time (minutes)</label>
              <input
                className="number-input"
                id="filter-time"
                min="1"
                placeholder="e.g. 30"
                type="number"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label" htmlFor="filter-diet">Dietary Restrictions</label>
              <select
                className="select"
                id="filter-diet"
                value={dietaryFilter}
                onChange={(e) => setDietaryFilter(e.target.value)}
              >
                <option value="">None</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="gluten_free">Gluten-Free</option>
                <option value="dairy_free">Dairy-Free</option>
                <option value="keto">Keto</option>
                <option value="paleo">Paleo</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label" htmlFor="serving-size">Serving Size</label>
              <input
                className="number-input"
                id="serving-size"
                min="1"
                type="number"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Recipes Section */}
        <section className="section" id="recipes">
          <h2 className="section-title">Recipe Suggestions</h2>
          {console.log('Rendering recipes, count:', recipes.length)}
          {loading ? (
            <div className="loading">
              <i className="fas fa-spinner fa-spin mr-2"></i> Loading recipes...
            </div>
          ) : recipes.length > 0 ? (
            <div className="recipe-grid">
              {recipes.map((recipe) => (
                <article key={recipe.id} className="recipe-card">
                  <img 
                    src={recipe.image ? `/img/${recipe.image}` : "https://placehold.co/400x300/png?text=Recipe+Image"} 
                    alt={`Photo of ${recipe.title}`} 
                    className="recipe-image"
                  />
                  <div className="recipe-content">
                    <h3 className="recipe-title">{recipe.title}</h3>
                    <p className="recipe-meta">
                      Difficulty: {recipe.difficulty} | {recipe.time} min
                    </p>
                    <p className="recipe-description">{recipe.description}</p>
                    <div className="recipe-actions">
                      <button 
                        className="favorite-btn"
                        onClick={() => saveRecipe(recipe.id)}
                      >
                        {recipe.saved ? (
                          <i className="fas fa-heart fa-lg"></i>
                        ) : (
                          <i className="far fa-heart fa-lg"></i>
                        )}
                      </button>
                      <button 
                        className="view-btn"
                        onClick={() => viewRecipeDetails(recipe)}
                      >
                        View Recipe
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              {userIngredients.length > 0 
                ? "No recipes found matching your criteria." 
                : "Enter ingredients and click 'Generate Recipes' to see suggestions."}
            </div>
          )}
        </section>

        {/* Favorites Section */}
        <section className="section" id="favorites">
          <h2 className="section-title">Your Favorite Recipes</h2>
          <div className="recipe-grid">
            {favorites.length > 0 ? (
              favorites.map((recipe) => (
                <article key={recipe.id} className="recipe-card">
                  <img 
                    src={recipe.image ? `/img/${recipe.image}` : "https://placehold.co/400x300/png?text=Recipe+Image"} 
                    alt={`Photo of ${recipe.title}`} 
                    className="recipe-image"
                  />
                  <div className="recipe-content">
                    <h3 className="recipe-title">{recipe.title}</h3>
                    <p className="recipe-meta">
                      Difficulty: {recipe.difficulty} | {recipe.time} min
                    </p>
                    <p className="recipe-description">{recipe.description}</p>
                    <div className="recipe-actions">
                      <button 
                        className="favorite-btn"
                        onClick={() => saveRecipe(recipe.id)}
                      >
                        <i className="fas fa-heart fa-lg"></i>
                      </button>
                      <button 
                        className="view-btn"
                        onClick={() => viewRecipeDetails(recipe)}
                      >
                        View Recipe
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-state">You have no favorite recipes yet.</p>
            )}
          </div>
        </section>

        {/* About Section */}
        <section className="section" id="about">
          <h2 className="section-title">About Smart Recipe Generator</h2>
          <p className="section-description">
            Smart Recipe Generator helps you create tasty meals using the ingredients you have. Enter ingredients manually or upload photos to identify them. Set your dietary preferences to get personalized recipe ideas with detailed instructions and nutrition info.
          </p>
          <p className="section-description">
            You can filter recipes by difficulty, cooking time, and dietary needs, and adjust serving sizes. Save your favorites and rate recipes to improve suggestions.
          </p>
          <p className="section-description">
            Built with React.js, Node.js, and MongoDB, this app uses AI-powered ingredient recognition to enhance your cooking experience.
          </p>
        </section>
      </main>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{selectedRecipe.title}</h2>
              <button 
                className="close-btn"
                onClick={closeRecipeDetails}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <img 
              src={selectedRecipe.image ? `/img/${selectedRecipe.image}` : "https://placehold.co/400x300/png?text=Recipe+Image"} 
              alt={`Photo of ${selectedRecipe.title}`} 
              className="modal-image"
            />
            
            <p className="modal-description">{selectedRecipe.description}</p>
            
            <div className="modal-grid">
              <div className="modal-grid-item">
                <h3>Difficulty</h3>
                <p>{selectedRecipe.difficulty}</p>
              </div>
              <div className="modal-grid-item">
                <h3>Cooking Time</h3>
                <p>{selectedRecipe.time} minutes</p>
              </div>
              <div className="modal-grid-item">
                <h3>Servings</h3>
                <p>{selectedRecipe.servings}</p>
              </div>
              <div className="modal-grid-item">
                <h3>Rating</h3>
                <p>{selectedRecipe.rating} / 5</p>
              </div>
            </div>
            
            <div className="ingredients-list-modal">
              <h3 className="ingredients-title">Ingredients</h3>
              <ul className="ingredients-items">
                {selectedRecipe.ingredients.map((ingredient, index) => {
                  // Calculate scaled amount based on serving size
                  const scaledAmount = (ingredient.amount * servingSize) / selectedRecipe.servings;
                  return (
                    <li key={index}>{scaledAmount.toFixed(2)} {ingredient.name}</li>
                  );
                })}
              </ul>
            </div>

            {/* Nutritional Info Section */}
            {selectedRecipe.nutrition && (
              <div className="nutrition-info">
                <h3 className="nutrition-title">Nutritional Information (per serving)</h3>
                <ul className="nutrition-list">
                  {Object.entries(selectedRecipe.nutrition).map(([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="instructions-list">
              <h3 className="instructions-title">Instructions</h3>
              <ol className="instructions-items">
                {selectedRecipe.instructions.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
            
            <div className="modal-footer">
              <button 
                className="favorite-btn"
                onClick={() => saveRecipe(selectedRecipe.id)}
              >
                {selectedRecipe.saved ? (
                  <i className="fas fa-heart mr-2"></i>
                ) : (
                  <i className="far fa-heart mr-2"></i>
                )}
                {selectedRecipe.saved ? "Remove from Favorites" : "Add to Favorites"}
              </button>
              <div className="rating">
                <span className="rating-label">Rate:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <i 
                    key={star}
                    className={`fas fa-star star cursor-pointer ${star <= selectedRecipe.rating ? 'active' : ''}`}
                    onClick={() => rateRecipe(selectedRecipe.id, star)}
                    onMouseEnter={(e) => {
                      // Add hover effect
                      const stars = e.target.parentElement.querySelectorAll('.star');
                      stars.forEach((s, index) => {
                        if (index < star) {
                          s.classList.add('hover');
                        }
                      });
                    }}
                    onMouseLeave={(e) => {
                      // Remove hover effect
                      const stars = e.target.parentElement.querySelectorAll('.star');
                      stars.forEach(s => s.classList.remove('hover'));
                    }}
                  ></i>
                ))}
              </div>
            </div>

            {/* Substitution Suggestions Section */}
            {selectedRecipe.substitutions && selectedRecipe.substitutions.length > 0 && (
              <div className="substitution-suggestions">
                <h3>Substitution Suggestions</h3>
                <ul>
                  {selectedRecipe.substitutions.map((sub, index) => (
                    <li key={index}>{sub.original} can be substituted with {sub.alternative}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations Section */}
            <section className="recommendations">
              <h3>Recommended Recipes</h3>
              {/* Placeholder for recommended recipes */}
              {/* This can be populated based on ratings or other logic */}
            </section>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="footer-content">
          © 2025 Smart Recipe Generator. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default App;
