import sys
import json
import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "salary_model.pkl")

try:
    # Load trained model
    model = joblib.load(MODEL_PATH)

    # Get input from Node.js
    input_data = json.loads(sys.stdin.read())

    # Prepare input data
    input_df = pd.DataFrame([{
        "Job_Title": input_data.get("Job_Title", "Data Scientist"),
        "Location": input_data.get("Location", "Ahmedabad"),
        "Experience": float(input_data.get("Experience_Years", 0)),
        "Skills": input_data.get("Skills", "")
    }])

    # Predict salary
    prediction = model.predict(input_df)

    print(json.dumps({
        "success": True,
        "predictedSalary": float(prediction[0])
    }))

except Exception as e:
    print(json.dumps({
        "success": False,
        "message": str(e)
    }))
    sys.exit(1)
