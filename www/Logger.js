// ============================================
// LOGGER - SYSTÈME DE LOGS PROFESSIONNEL
// ============================================

const fs = require('fs');
const path = require('path');

class Logger {
    constructor(debugEnabled = false) {
        this.debugEnabled = debugEnabled;
        this.logs = [];
        this.stats = {
            debug: 0,
            info: 0,
            warn: 0,
            error: 0
        };
        this.startTime = Date.now();
    }

    _log(level, category, message, data = null) {
        const timestamp = new Date().toISOString();
        const log = {
            timestamp,
            level: level.toUpperCase(),
            category: category.toUpperCase(),
            message,
            data
        };

        this.logs.push(log);
        this.stats[level]++;

        // Formatter pour console
        const color = this._getColor(level);
        const reset = '\x1b[0m';
        const categoryStr = `[${category.toUpperCase()}]`.padEnd(12);

        let consoleMsg = `${color}${timestamp} ${level.toUpperCase().padEnd(5)} ${categoryStr}${reset} ${message}`;

        if (data) {
            consoleMsg += ` ${JSON.stringify(data)}`;
        }

        console.log(consoleMsg);
    }

    _getColor(level) {
        const colors = {
            debug: '\x1b[36m',  // Cyan
            info: '\x1b[32m',   // Green
            warn: '\x1b[33m',   // Yellow
            error: '\x1b[31m'   // Red
        };
        return colors[level] || '\x1b[0m';
    }

    debug(category, message, data = null) {
        if (this.debugEnabled) {
            this._log('debug', category, message, data);
        }
    }

    info(category, message, data = null) {
        this._log('info', category, message, data);
    }

    warn(category, message, data = null) {
        this._log('warn', category, message, data);
    }

    error(category, message, error = null) {
        const errorData = error ? {
            message: error.message,
            stack: error.stack,
            ...(error.code && { code: error.code })
        } : null;
        this._log('error', category, message, errorData);
    }

    printSummary() {
        const uptime = ((Date.now() - this.startTime) / 1000).toFixed(2);
        console.log('\n' + '='.repeat(60));
        console.log('📊 RÉSUMÉ DES LOGS');
        console.log('='.repeat(60));
        console.log(`⏱️  Uptime: ${uptime}s`);
        console.log(`🐛 Debug:  ${this.stats.debug}`);
        console.log(`ℹ️  Info:   ${this.stats.info}`);
        console.log(`⚠️  Warn:   ${this.stats.warn}`);
        console.log(`❌ Error:  ${this.stats.error}`);
        console.log(`📝 Total:  ${this.logs.length} logs`);
        console.log('='.repeat(60) + '\n');
    }

    saveToFile(filename = 'logs.json') {
        try {
            const logData = {
                startTime: new Date(this.startTime).toISOString(),
                endTime: new Date().toISOString(),
                uptime: ((Date.now() - this.startTime) / 1000).toFixed(2) + 's',
                stats: this.stats,
                logs: this.logs
            };

            fs.writeFileSync(filename, JSON.stringify(logData, null, 2));
            console.log(`\n💾 Logs sauvegardés: ${filename}`);
        } catch (error) {
            console.error('❌ Erreur sauvegarde logs:', error.message);
        }
    }

    clear() {
        this.logs = [];
        this.stats = {
            debug: 0,
            info: 0,
            warn: 0,
            error: 0
        };
    }

    getLogs(level = null, category = null) {
        let filtered = this.logs;

        if (level) {
            filtered = filtered.filter(log => log.level === level.toUpperCase());
        }

        if (category) {
            filtered = filtered.filter(log => log.category === category.toUpperCase());
        }

        return filtered;
    }
}

module.exports = Logger;
