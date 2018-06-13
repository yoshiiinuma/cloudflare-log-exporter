
import fs from 'fs';
import dateFormat from 'dateformat';

let Log = {};

Log.Type = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5 
}

const Label = {
  DEBUG: 'DEBUG',
  INFO:  'INFO ',
  WARN:  'WARN ',
  ERROR: 'ERROR',
  FATAL: 'FATAL' 
};

const DEFAULT_LOG_LEVEL = Log.Type.ERROR;
const DEFAULT_LOG_DIR = './logs';
const DEFAULT_LOG_FILE = 'default.log';

let logEnabled = false;
let logLevel = DEFAULT_LOG_LEVEL;
let logFile = DEFAULT_LOG_DIR + '/' + DEFAULT_LOG_FILE; 

const logFormat = (label, msg) => {
  let time = dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss.l')
  return time + ' ' + label + ' ' + msg;
}

const writeToStdout = (label, msg) => {
  //process.stdout.write(logFormat(label, msg));
  console.log(logFormat(label, msg));
};

const appendToFile = (label, msg) => {
  fs.appendFile(logFile, logFormat(label, msg) + "\n", (err) => {
    if (err) throw err;
  });
};

let append = writeToStdout;

const switchToStdout = () => { 
  console.log('Switch To STDOUT');
  append = writeToStdout;
}

const switchToFile = () => {
  console.log('Switch To File: ' + logFile);
  append = appendToFile;
}

Log.enable = () => {
  logEnabled = true;
  switchToFile();
}

Log.disable = () => {
  logEnabled = false;
  switchToStdout();
}

Log.setLogFile = (filePath) => { logFile = filePath; }

Log.showStatus = () => {
  console.log(' Log Enabled: ' + logEnabled);
  console.log(' Log Level  : ' + Log.convLevelToString(logLevel));
  console.log(' Log File   : ' + logFile);
}

Log.convStringLevel = (level) => {
  if (typeof level === 'string') {
    level = level.toLowerCase();
    if (level === 'debug') return Log.Type.DEBUG;
    if (level === 'info') return Log.Type.INFO;
    if (level === 'warn') return Log.Type.WARN;
    if (level === 'error') return Log.Type.ERROR;
    if (level === 'fatal') return Log.Type.FATAL;
  }
}

Log.convLevelToString = (level) => {
  if (typeof level === 'number') {
    if (level === Log.Type.DEBUG) return 'DEBUG';
    if (level === Log.Type.INFO) return 'INFO';
    if (level === Log.Type.WARN) return 'WARN';
    if (level === Log.Type.ERROR) return 'ERROR';
    if (level === Log.Type.FATAL) return 'FATAL';
  }
}

Log.setLogLevel = (level) => {
  if (typeof level === 'number') {
    logLevel = level;
  }
  if (typeof level === 'string') {
    level = level.toLowerCase();
    if (level === 'debug') {
      logLevel = Log.Type.DEBUG;
    } else if (level === 'info') {
      logLevel = Log.Type.INFO;
    } else if (level === 'warn') {
      logLevel = Log.Type.WARN;
    } else if (level === 'error') {
      logLevel = Log.Type.ERROR;
    } else if (level === 'fatal') {
      logLevel = Log.Type.FATAL;
    } else {
      logLevel = Log.Type.ERROR;
    }
  }
}

/**
 * arg: { disableLog, logLevel, logDir, logFile, env }
 *   enableLog (optional)  : redirects outputs from stdout to file if true
 *   logLevel (optional)   : specifies the log level; default ERROR
 *   logDir (optional)     : specifies the directory to put log file; default '.logs'
 *   logFile (optional)    : path to the log file; ignore logDir if spcified
 *   env (optional)        : makes logFile = logDir + '/' + env + '.log' if specfied
 */
Log.initialize = (arg) => {
  if (arg.enableLog) Log.enable();
  if (arg.logLevel) Log.setLogLevel(arg.logLevel);
  if (arg.logFile) {
    Log.setLogFile(arg.logFile);
  } else if (arg.env) {
    let dir = DEFAULT_LOG_DIR;
    if (arg.logDir) {
      dir = arg.logDir;
    }
    if (!dir.endsWith('/')) dir += '/';
    Log.setLogFile(dir + arg.env + '.log');
  }
}

Log.debug = (msg) => {
  if (logLevel > Log.Type.DEBUG) return;
  append(Label.DEBUG, msg); 
}

Log.info = (msg) => {
  if (logLevel > Log.Type.INFO) return;
  append(Label.INFO, msg); 
}

Log.warn = (msg) => {
  if (logLevel < Log.Type.WARN) return;
  append(Label.WARN, msg); 
}

Log.error = (msg) => {
  if (logLevel > Log.Type.ERROR) return;
  append(Label.ERROR, msg); 
}

Log.fatal = (msg) => {
  if (logLevel > Log.Type.FATAL) return;
  append(Label.FATAL, msg); 
}

export default Log;
