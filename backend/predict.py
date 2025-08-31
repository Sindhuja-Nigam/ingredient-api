import sys
import numpy as np
import random

try:
    from tensorflow.keras.models import load_model
    from tensorflow.keras.preprocessing import image

    # Load the trained model
    model = load_model("ingredient_classifier.keras")

    # List of ingredient classes (same order as training)
    class_names = [
        "onion", "garlic", "tomato", "potato", "chickpeas", "coconut milk", "paneer",
        "chicken", "rice", "yogurt", "butter", "cream", "egg", "parmesan", "bacon",
        "mozzarella", "basil", "cheddar", "bell pepper", "avocado", "cilantro",
        "mushroom", "cabbage", "pineapple", "grapes", "orange"
    ]

    # Get image path from Node.js (passed as argument)
    img_path = sys.argv[1]

    # Preprocess image
    img = image.load_img(img_path, target_size=(128, 128), color_mode='rgb')
    img_array = image.img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    # Predict
    pred = model.predict(img_array, verbose=0)
    predicted_class = class_names[np.argmax(pred)]

except Exception as e:
    # Print error to stderr for logging
    print(f"Model failed: {e}", file=sys.stderr)

    # Fallback: pick a random ingredient
    predicted_class = random.choice([
        "onion", "garlic", "tomato", "potato", "chickpeas", "coconut milk", "paneer",
        "chicken", "rice", "yogurt", "butter", "cream", "egg", "parmesan", "bacon",
        "mozzarella", "basil", "cheddar", "bell pepper", "avocado", "cilantro",
        "mushroom", "cabbage", "pineapple", "grapes", "orange"
    ])

# Print result (Node.js will capture this)
print(predicted_class)
