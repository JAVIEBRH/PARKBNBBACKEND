import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const customFormat = printf(({ level, message, timestamp, stack, label }) => {
  const labelStr = label ? `[${label}] ` : '';
  return `${timestamp} ${level}: ${labelStr}${stack || message}`;
});

export const createLogger = (label = 'App') => {
  return winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(
      errors({ stack: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.label({ label }),
      customFormat
    ),
    transports: [
      new winston.transports.Console({
        format: combine(colorize(), customFormat),
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
      }),
    ],
  });
};

export const logger = createLogger();

