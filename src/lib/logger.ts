import winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, errors, json, colorize, align } = winston.format;

// Format for console (readable with colors)
const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  align(),
  printf(({ level, message, timestamp, stack }) => {
    return `[${timestamp}] ${level}: ${stack || message}`;
  })
);

// Format for files (structured JSON)
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const isVercel = process.env.VERCEL === '1';

const transports: winston.transport[] = [];

if (isVercel) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
} else {
  transports.push(
    // Write all logs with level `error` and below to `error-%DATE%.log`
    new winston.transports.DailyRotateFile({
      dirname: 'logs',
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d',
    }),
    // Write all logs to `combined-%DATE%.log`
    new winston.transports.DailyRotateFile({
      dirname: 'logs',
      filename: 'combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
    })
  );

  if (process.env.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
      })
    );
  }
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: isVercel ? consoleFormat : fileFormat,
  transports,
});

export default logger;
