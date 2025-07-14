/**
 * Simple Token Logging for Interactive Book Project
 * Tracks development interactions and estimates costs
 */

class TokenLogger {
    constructor() {
        this.logs = [];
        this.loadFromStorage();
    }

    /**
     * Log a new interaction
     * @param {string} userInput - What the user asked/did
     * @param {string} assistantOutput - Claude's response/action
     * @param {string} type - Type of interaction (e.g., 'code', 'debug', 'feature')
     */
    log(userInput, assistantOutput, type = 'general') {
        const entry = {
            timestamp: new Date().toISOString(),
            type: type,
            userInput: userInput.substring(0, 200), // Truncate long inputs
            assistantOutput: assistantOutput.substring(0, 200), // Truncate long outputs
            estimatedTokens: this.estimateTokens(userInput + assistantOutput),
            estimatedCost: 0 // Will calculate below
        };

        // Rough cost estimation (Claude Sonnet pricing)
        entry.estimatedCost = (entry.estimatedTokens / 1000000) * 15.0; // $15 per million tokens

        this.logs.push(entry);
        this.saveToStorage();
        
        console.log('📝 Logged interaction:', {
            type: entry.type,
            tokens: entry.estimatedTokens,
            cost: `$${entry.estimatedCost.toFixed(4)}`
        });
    }

    /**
     * Estimate token count from text
     * @param {string} text - Text to analyze
     * @returns {number} Estimated token count
     */
    estimateTokens(text) {
        // Rough estimation: ~4 chars per token for English, ~2 for Chinese
        const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
        const totalChars = text.length;
        const englishChars = totalChars - chineseChars;
        
        return Math.ceil((chineseChars * 2) + (englishChars * 0.25));
    }

    /**
     * Get summary of all logged interactions
     */
    getSummary() {
        const totalTokens = this.logs.reduce((sum, log) => sum + log.estimatedTokens, 0);
        const totalCost = this.logs.reduce((sum, log) => sum + log.estimatedCost, 0);
        
        const typeBreakdown = {};
        this.logs.forEach(log => {
            if (!typeBreakdown[log.type]) {
                typeBreakdown[log.type] = { count: 0, tokens: 0, cost: 0 };
            }
            typeBreakdown[log.type].count++;
            typeBreakdown[log.type].tokens += log.estimatedTokens;
            typeBreakdown[log.type].cost += log.estimatedCost;
        });

        return {
            totalInteractions: this.logs.length,
            totalTokens: totalTokens,
            totalCost: totalCost,
            typeBreakdown: typeBreakdown,
            averageTokensPerInteraction: totalTokens / (this.logs.length || 1),
            averageCostPerInteraction: totalCost / (this.logs.length || 1)
        };
    }

    /**
     * Export logs to JSON for external analysis
     */
    exportLogs() {
        const exportData = {
            project: 'Interactive Book - 在演算法世界，播下人性種子',
            exportDate: new Date().toISOString(),
            summary: this.getSummary(),
            logs: this.logs
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `token_logs_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('📊 Token logs exported');
    }

    /**
     * Display summary in console
     */
    showSummary() {
        const summary = this.getSummary();
        
        console.group('📊 Token Usage Summary');
        console.log(`Total Interactions: ${summary.totalInteractions}`);
        console.log(`Total Tokens: ${summary.totalTokens.toLocaleString()}`);
        console.log(`Total Cost: $${summary.totalCost.toFixed(4)}`);
        console.log(`Average per Interaction: ${Math.round(summary.averageTokensPerInteraction)} tokens, $${summary.averageCostPerInteraction.toFixed(4)}`);
        
        console.group('By Type:');
        Object.entries(summary.typeBreakdown).forEach(([type, data]) => {
            console.log(`${type}: ${data.count} interactions, ${data.tokens} tokens, $${data.cost.toFixed(4)}`);
        });
        console.groupEnd();
        console.groupEnd();
    }

    /**
     * Save logs to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('bookTokenLogs', JSON.stringify(this.logs));
        } catch (error) {
            console.warn('Could not save token logs to localStorage:', error);
        }
    }

    /**
     * Load logs from localStorage
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('bookTokenLogs');
            if (saved) {
                this.logs = JSON.parse(saved);
                console.log(`📚 Loaded ${this.logs.length} previous token logs`);
            }
        } catch (error) {
            console.warn('Could not load token logs from localStorage:', error);
            this.logs = [];
        }
    }

    /**
     * Clear all logs
     */
    clearLogs() {
        this.logs = [];
        this.saveToStorage();
        console.log('🗑️ Token logs cleared');
    }
}

// Create global instance
window.tokenLogger = new TokenLogger();

// Example usage functions
window.logInteraction = (input, output, type) => {
    window.tokenLogger.log(input, output, type);
};

window.showTokenSummary = () => {
    window.tokenLogger.showSummary();
};

window.exportTokenLogs = () => {
    window.tokenLogger.exportLogs();
};

// Auto-log some example interactions for this project
window.tokenLogger.log(
    "Create interactive book project with Chinese content",
    "Created HTML, CSS, JS files with mind map, search, and expandable chapters",
    "project_setup"
);

window.tokenLogger.log(
    "Add mind map functionality with jsMind library",
    "Integrated jsMind library with clickable nodes and modal content display",
    "feature_implementation"
);

window.tokenLogger.log(
    "Debug expand/collapse functionality",
    "Fixed CSS and JavaScript issues with chapter toggling and event listeners",
    "debugging"
);

console.log('🚀 Token Logger initialized! Use logInteraction(), showTokenSummary(), or exportTokenLogs()');