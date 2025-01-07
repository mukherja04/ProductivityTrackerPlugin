const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

let logFilePath;
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
        logFilePath = path.join(workspaceFolders[0].uri.fsPath, 'productivity_log.json');
        console.log(`Log file path set to: ${logFilePath}`);
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
            fs.writeFileSync(
                logFilePath,
                JSON.stringify([...existingLog, ...logData], null, 2),
                'utf-8'
            );

            console.log(`[logUnsavedChanges] Logged changes: ${JSON.stringify(logData)}`);
        }

        // Clear unsavedChanges after logging
        Object.keys(unsavedChanges).forEach(key => delete unsavedChanges[key]);
    } catch (error) {
        console.error('[logUnsavedChanges] Error logging changes:', error);
    }
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

