🍳 Smart Recipe Generator

Smart Recipe Generator is a web app that suggests delicious recipes based on the ingredients you have on hand. You can enter ingredients manually or upload photos to identify them automatically. Apply filters like dietary preferences, cooking time, and difficulty. Save your favorite recipes, rate them, and get personalized recommendations.

✨ Features

>>Add ingredients by typing or uploading images.

>>AI-powered ingredient recognition using TensorFlow.

>>Filter recipes by difficulty, cooking time, diet, and serving size.

>>Save and manage favorite recipes.

>>Rate recipes and get personalized recommendations.

>>Substitution suggestions for missing ingredients.

>>View detailed instructions and nutrition info.

🛠️ Technologies

>>Frontend: React.js (Vite)

>>Backend: Node.js + Express.js

>>AI/ML: TensorFlow + Keras model (ingredient_classifier.keras)

>>File Uploads: Multer

>>Data Storage: JSON files (recipes, favorites, ratings)

⚙️ Setup Instructions

1.Clone the repo:

git clone https://github.com/your-username/smart-recipe-generator.git


2.Install backend dependencies:

cd backend
npm install


3.Install frontend dependencies:

cd frontend
npm install


4.Run the backend server:

cd backend
npm start


5.Run the React app:

cd frontend
npm start


6.Ensure Python is installed with tensorflow and numpy.

7.Place the trained model file ingredient_classifier.keras in the backend root.

📖 Usage

>>Enter ingredients manually or upload an image to recognize ingredients.

>>Click Generate Recipes to view matching recipes.

>>Apply filters (diet, time, difficulty, serving size).

>>Open recipe details for steps and nutrition info.

>>Save favorites and rate recipes.

>>Explore personalized recommendations based on your ratings.

Notes=>

>>The AI model falls back to random ingredient selection if recognition fails.

>>JSON files are used for persistence; migrate to a database for production use.

>>Designed to be deployed with Render (backend) and Netlify/Vercel (frontend).
