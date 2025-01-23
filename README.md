
# Productivity Tracker Plugin

The Productivity Tracker Plugin is a VSCode extension designed to monitor and analyze programming productivity. It tracks coding activity, trains a machine learning model, and provides insights into productivity trends.

## Features
- Tracks characters added to files during coding sessions.
- Saves activity logs to `productivity_log.json` in the user's workspace.
- Uses a Decision Tree model to predict productivity trends based on day and time.
- Displays productivity insights and time series analysis in VSCode.
- Provides options to retrain the model and generate insights via the Command Palette.

---

## Installation Instructions

### 1. Clone the Repository
Clone the project to your local machine:

```bash
git clone <repository-url>
cd productivity-tracker-plugin
```

### 2. Install Dependencies
Ensure Node.js and npm are installed on your system.

Install the required dependencies for the extension:

```bash
npm install
```

Install the Python libraries required for the ML scripts:

```bash
pip install -r requirements.txt
```

### 3. Open in VSCode
- Open the project folder in VSCode.
- Open the `productivitytrackerplugin` workspace.

### 4. Run the Extension
- Press `F5` in VSCode to run the extension in a new Extension Development Host window.

---

## Usage

### Logging Productivity
1. Open a folder in VSCode. The extension automatically tracks coding activity and saves it to `productivity_log.json` in the folder.

### Generating Insights
1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac).
2. Search for and select **"ProductivityTracker: Generate Insights"**.
3. Insights are displayed in VSCode, and a time series plot is saved as `productivity_plot.png` in the workspace folder.

### Model Training
- The model is retrained automatically when insights are generated.

### Viewing Logs
- The raw productivity logs are saved as `productivity_log.json` in the workspace.

---

## Project Structure

- `extension.js`: Main file for the VSCode extension.
- `train_model.py`: Python script for training the Decision Tree model.
- `generate_insights.py`: Python script for generating productivity insights and plots.
- `requirements.txt`: Python dependencies.
- `test_productivity_log.json`: Sample log data for testing.

---

## Requirements

### Software
- Node.js (16.x or higher)
- Python (3.8 or higher)
- VSCode

### Python Libraries
- `scikit-learn`
- `pandas`
- `matplotlib`

Install all required Python libraries using:
```bash
pip install -r requirements.txt
```

---

## Troubleshooting

### Common Issues
1. **No Productivity Log Found**: Ensure you have a folder open in VSCode before using the extension.
2. **Python Script Errors**: Ensure all Python dependencies are installed and the paths to the scripts are correct.
3. **Empty Plot**: Ensure there is sufficient data in the `productivity_log.json` file.

### Debugging
- Use the VSCode Output tab to check for logs.
- Check the console logs in the Extension Development Host window.

---

## Future Improvements
- Add support for additional ML models.
- Provide interactive visualization options in VSCode.
- Improve accuracy by incorporating more features (e.g., file types, coding duration).