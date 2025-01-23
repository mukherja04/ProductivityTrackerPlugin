const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

let logFilePath;
let modelFilePath;
const fileContentCache = {}; // Cache for file content
const unsavedChanges = {}; // To store charsAdded by file since the last save or log
let logInterval; // Timer for periodic logging

/**
 * Called when the extension is activated
 * @param {vscode.ExtensionContext} context 
 */
function activate(context) {
    vscode.window.showInformationMessage('Productivity Tracker extension is now active!');
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        // Log and model paths for the current project
        const workspaceDir = workspaceFolders[0].uri.fsPath;
        logFilePath = path.join(workspaceDir, 'productivity_log.json');
        modelFilePath = path.join(workspaceDir, 'productivity_model.pkl');
    } else {
        vscode.window.showErrorMessage("Please open a folder in VSCode to enable logging.");
        return;
    }

    function filterWhitespace(text) {
        return text.replace(/\s+/g, ''); // Removes all spaces, tabs, and line breaks
    }

    const onOpenListener = vscode.workspace.onDidOpenTextDocument(document => {
        const fileName = document.fileName;

        // Ignore productivity_log.json itself
        if (fileName.endsWith('productivity_log.json')) {
            return;
        }

        // Initialize the cache if not already present
        if (!fileContentCache[fileName]) {
            const currentChars = filterWhitespace(document.getText()).length;
            fileContentCache[fileName] = currentChars;
        }
    });

    const onSaveListener = vscode.workspace.onDidSaveTextDocument(document => {
        const fileName = document.fileName;

        // Ignore productivity_log.json itself
        if (fileName.endsWith('productivity_log.json')) {
            return;
        }

        const currentChars = filterWhitespace(document.getText()).length;
        const lastChars = fileContentCache[fileName] || 0;
        const charsAdded = currentChars - lastChars;

        if (charsAdded > 0) {
            // Update the unsaved changes cache
            unsavedChanges[fileName] = (unsavedChanges[fileName] || 0) + charsAdded;
        }

        fileContentCache[fileName] = currentChars; // Update cache
    });

    context.subscriptions.push(onOpenListener, onSaveListener);

    // Set up periodic logging every 5 minutes (300,000 ms)
    logInterval = setInterval(() => {
        logUnsavedChanges();
    }, 300000); // 5 minutes in milliseconds

    // Register a custom command to show a log summary
    const showLogCommand = vscode.commands.registerCommand('productivityTracker.showLog', () => {
        showLogSummary();
    });
    context.subscriptions.push(showLogCommand);

    const generateInsightsCommand = vscode.commands.registerCommand(
        'productivityTracker.generateInsights',
        () => {
            generateInsights();
        }
    );

    context.subscriptions.push(generateInsightsCommand);
}

/**
 * Called when the extension is deactivated
 */
function deactivate() {
    // Clear the interval to stop periodic logging
    if (logInterval) {
        clearInterval(logInterval);
    }

    // Log any remaining unsaved changes before the extension deactivates
    logUnsavedChanges();
}

/**
 * Logs unsaved changes to the productivity log
 */
function logUnsavedChanges() {
    try {
        const timestamp = new Date().toISOString();
        const logData = [];

        // Add unsaved changes to the log data
        for (const [fileName, charsAdded] of Object.entries(unsavedChanges)) {
            logData.push({ timestamp, charsAdded, fileName });
        }

        if (logData.length > 0) {
            // Read the existing log file
            let existingLog = [];
            if (fs.existsSync(logFilePath)) {
                const rawData = fs.readFileSync(logFilePath, 'utf-8');
                existingLog = JSON.parse(rawData);
            }

            // Append the new log data and write back to the file
            const combinedLog = [...existingLog, ...logData];
            fs.writeFileSync(logFilePath, JSON.stringify(combinedLog, null, 2), 'utf-8');

            console.log(`[logUnsavedChanges] Logged changes: ${JSON.stringify(logData)}`);
        }

        // Clear unsavedChanges after logging
        Object.keys(unsavedChanges).forEach(key => delete unsavedChanges[key]);
    } catch (error) {
        console.error('[logUnsavedChanges] Error logging changes:', error);
    }
}

function generateInsights() {
    const { spawnSync } = require('child_process');

    try {
        // Check if the log file exists
        if (!fs.existsSync(logFilePath)) {
            vscode.window.showErrorMessage('Productivity log file not found! Please start coding to generate logs.');
            return;
        }

        // Check if the log file is empty
        const rawData = fs.readFileSync(logFilePath, 'utf-8');
        if (!rawData.trim()) {
            vscode.window.showErrorMessage('Productivity log file is empty! Please continue coding to populate the log.');
            return;
        }

        // Parse the log data
        const logData = JSON.parse(rawData);
        if (logData.length === 0) {
            vscode.window.showErrorMessage('No data in productivity log. Start coding to generate meaningful logs.');
            return;
        }

        // Path to the training script
        const trainingScriptPath = path.join(__dirname, 'train_model.py');

        if (!fs.existsSync(trainingScriptPath)) {
            vscode.window.showErrorMessage('Training script not found!');
            return;
        }

        // Run the training script
        const result = spawnSync('python', [
            trainingScriptPath,
            '--log', logFilePath,
            '--model', modelFilePath
        ]);

        if (result.error) {
            console.error('Error running training script:', result.error);
            vscode.window.showErrorMessage('Error training the model. Check console for details.');
            return;
        }

        vscode.window.showInformationMessage('Model trained successfully.');

        // Generate insights using the trained model
        generateModelInsights(modelFilePath);

    } catch (error) {
        console.error('Error generating insights:', error);
        vscode.window.showErrorMessage('Failed to generate insights. Check console for details.');
    }
}


function generateModelInsights(modelPath) {
    const { spawnSync } = require('child_process');

    // Path to the insights script
    const insightsScriptPath = path.join(__dirname, 'generate_insights.py');
    const plotFilePath = path.join(path.dirname(logFilePath), 'productivity_plot.png');

    if (!fs.existsSync(insightsScriptPath)) {
        vscode.window.showErrorMessage('Insights script not found!');
        return;
    }

    // Run the insights script to generate the plot
    const result = spawnSync('python', [
        insightsScriptPath,
        '--model', modelFilePath,
        '--log', logFilePath,
        '--output', plotFilePath
    ]);

    if (result.error) {
        console.error('Error running insights script:', result.error);
        vscode.window.showErrorMessage('Failed to generate insights. Check console for details.');
        return;
    }

    vscode.window.showInformationMessage(plotFilePath);
    vscode.window.showInformationMessage('Insights generated successfully.');

    // Open the plot in VSCode
    vscode.workspace.openTextDocument(plotFilePath).then(doc => {
        vscode.window.showTextDocument(doc);
    });
}


/**
 * Reads the log file and displays a summary in VSCode
 */
function showLogSummary() {
    try {
        // Check if the log file exists
        if (!fs.existsSync(logFilePath)) {
            vscode.window.showInformationMessage("No log data found.");
            return;
        }

        // Read the log file with encoding
        const rawData = fs.readFileSync(logFilePath, 'utf-8'); // Specify 'utf-8' encoding
        const logData = JSON.parse(rawData);

        // Summarize the saved entries
        const totalSaves = logData.length; // Total save events
        const totalCharsAdded = logData.reduce((sum, entry) => sum + (entry.charsAdded || 0), 0); // Sum of charsAdded

        // Display the summary
        vscode.window.showInformationMessage(
            `Activity Summary:\nFiles Saved: ${totalSaves}\nTotal Characters Added: ${totalCharsAdded}`
        );
    } catch (error) {
        console.error('Failed to show log summary:', error);
        vscode.window.showErrorMessage('Error reading log file. Check the console for more details.');
    }
}

module.exports = {
    activate,
    deactivate
};