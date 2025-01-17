import argparse
import joblib
import json
import pandas as pd
from sklearn.tree import DecisionTreeRegressor

# Parse arguments
parser = argparse.ArgumentParser(description="Train Decision Tree model.")
parser.add_argument("--log", required=True, help="Path to productivity log JSON file.")
parser.add_argument("--model", required=True, help="Path to save the Decision Tree model.")
args = parser.parse_args()

# Load productivity log data
try:
    with open(args.log, "r") as f:
        log_data = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    print("Error: Productivity log file is missing or invalid!")
    exit(1)

if not log_data:
    print("Error: Productivity log file is empty!")
    exit(1)

# Preprocess data into day-hour features
df = pd.DataFrame([
    {"day": int(entry["timestamp"][5:7]), "hour": int(entry["timestamp"][11:13]), "charsAdded": entry["charsAdded"]}
    for entry in log_data
])

X = df[["day", "hour"]]
y = df["charsAdded"]

# Train Decision Tree model
print("Training Decision Tree model...")
model = DecisionTreeRegressor(random_state=42)
model.fit(X, y)

# Save the model
joblib.dump(model, args.model)
print(f"Model saved to {args.model}.")
