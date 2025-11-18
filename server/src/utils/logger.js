const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const currentLevel = process.env.LOG_LEVEL ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] : LOG_LEVELS.INFO;

function log(level, message, ...args) {
  if (LOG_LEVELS[level] >= currentLevel) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}]`, message, ...args);
  }
}

module.exports = {
  debug: (msg, ...args) => log('DEBUG', msg, ...args),
  info: (msg, ...args) => log('INFO', msg, ...args),
  warn: (msg, ...args) => log('WARN', msg, ...args),
  error: (msg, ...args) => log('ERROR', msg, ...args)
};
