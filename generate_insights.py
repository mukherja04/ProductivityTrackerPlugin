import argparse
import joblib
import pandas as pd
import matplotlib.pyplot as plt

# Parse arguments
parser = argparse.ArgumentParser(description="Generate insights and time series plot from Decision Tree model.")
parser.add_argument("--model", required=True, help="Path to the trained model.")
parser.add_argument("--log", required=True, help="Path to the productivity log JSON file.")
parser.add_argument("--output", required=True, help="Path to save the time series plot.")
args = parser.parse_args()

# Load productivity log data
log_data = pd.read_json(args.log)

# Preprocess data
log_data["timestamp"] = pd.to_datetime(log_data["timestamp"])
log_data["day"] = log_data["timestamp"].dt.dayofweek + 1  # Monday=1, Sunday=7
log_data["hour"] = log_data["timestamp"].dt.hour
aggregated = log_data.groupby(["day", "hour"]).agg({"charsAdded": "sum"}).reset_index()

# Load the trained model
model = joblib.load(args.model)

# Predict productivity for each time interval
aggregated["predicted_productivity"] = model.predict(aggregated[["day", "hour"]])

# Generate time series plot
aggregated["time"] = aggregated["day"].astype(str) + "-" + aggregated["hour"].astype(str)
plt.figure(figsize=(12, 6))
plt.plot(aggregated["time"], aggregated["predicted_productivity"], marker="o", label="Predicted Productivity")
plt.xticks(ticks=range(0, len(aggregated), max(len(aggregated) // 10, 1)),  # Space out ticks
           labels=aggregated["time"][::max(len(aggregated) // 10, 1)], rotation=45, fontsize=8)
plt.xlabel("Time (Day-Hour)")
plt.ylabel("Predicted Productivity")
plt.title("Time Series Analysis of Predicted Productivity")
plt.grid(True)
plt.legend()
plt.tight_layout()

# Save the plot
plt.savefig(args.output)
print(f"Time series plot saved to {args.output}.")
