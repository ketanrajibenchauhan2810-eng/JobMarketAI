import pandas as pd
import joblib
from pathlib import Path
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor

CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7rSOJAlD-5GM2Pgj2sGhD1nd0K7yqDn7M4Co6BmJiyFdkzPYIkDETJkISKNiR2W29O030UpUF9GQF/pub?output=csv"

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "salary_model.pkl"

data = pd.read_csv(CSV_URL)
data.columns = data.columns.str.strip()

# Normalize the available column names
aliases = {
    "Job_Title": ["Job_Title", "Job Title"],
    "Location": ["Location"],
    "Experience_Years": ["Experience_Years", "Experience Years"],
    "Skills": ["Required_Skills", "Skills", "Required Skills"],
    "Salary": [
        "Average_Salary_INR_Year",
        "Annual_Salary_INR",
        "Max_Salary_INR_Year",
        "Min_Salary_INR_Year"
    ]
}

def find_column(names):
    for name in names:
        if name in data.columns:
            return name
    return None

job_col = find_column(aliases["Job_Title"])
location_col = find_column(aliases["Location"])
experience_col = find_column(aliases["Experience_Years"])
skills_col = find_column(aliases["Skills"])
salary_col = find_column(aliases["Salary"])

if not job_col or not location_col or not salary_col:
    raise ValueError(
        "Required columns not found. CSV columns: "
        + str(data.columns.tolist())
    )

# Use average salary when available; otherwise calculate min/max average.
if salary_col in ["Min_Salary_INR_Year", "Max_Salary_INR_Year"]:
    min_col = find_column(["Min_Salary_INR_Year"])
    max_col = find_column(["Max_Salary_INR_Year"])

    if min_col and max_col:
        data["Target_Salary"] = (
            pd.to_numeric(data[min_col], errors="coerce")
            + pd.to_numeric(data[max_col], errors="coerce")
        ) / 2
    else:
        data["Target_Salary"] = pd.to_numeric(
            data[salary_col], errors="coerce"
        )
else:
    data["Target_Salary"] = pd.to_numeric(
        data[salary_col], errors="coerce"
    )

data["Job_Title"] = data[job_col].fillna("Unknown").astype(str)
data["Location"] = data[location_col].fillna("Unknown").astype(str)
data["Skills"] = (
    data[skills_col].fillna("Not specified").astype(str)
    if skills_col else "Not specified"
)
data["Experience"] = (
    pd.to_numeric(data[experience_col], errors="coerce")
    if experience_col else 0
)

data = data.dropna(subset=["Target_Salary"])
data = data[data["Target_Salary"] > 0]

if len(data) < 5:
    raise ValueError(
        "At least 5 valid salary records are required to train the model."
    )

features = ["Job_Title", "Location", "Skills", "Experience"]
X = data[features]
y = data["Target_Salary"]

categorical = ["Job_Title", "Location", "Skills"]
numeric = ["Experience"]

preprocessor = ColumnTransformer([
    ("categorical", Pipeline([
        ("fill", SimpleImputer(strategy="most_frequent")),
        ("encode", OneHotEncoder(handle_unknown="ignore"))
    ]), categorical),
    ("numeric", Pipeline([
        ("fill", SimpleImputer(strategy="median"))
    ]), numeric)
])

model = Pipeline([
    ("prepare", preprocessor),
    ("regressor", RandomForestRegressor(
        n_estimators=150,
        random_state=42
    ))
])

model.fit(X, y)
joblib.dump(model, MODEL_PATH)

print("Model training completed!")
print("Valid salary records:", len(data))
print("Salary column used:", salary_col)
print("Model saved:", MODEL_PATH)
