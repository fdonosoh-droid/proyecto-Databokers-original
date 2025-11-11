/**
 * DATABROKERS - LOGGER UTILITY
 * Sistema de logging centralizado
 *
 * @version 1.0
 * @author Sistema Databrokers
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success';

interface LogOptions {
  timestamp?: boolean;
  color?: boolean;
}

class Logger {
  private colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
  };

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    options: LogOptions = { timestamp: true, color: true }
  ): string {
    const timestamp = options.timestamp ? `[${this.getTimestamp()}]` : '';
    const levelStr = level.toUpperCase().padEnd(7);

    if (options.color) {
      const colorMap = {
        info: this.colors.blue,
        warn: this.colors.yellow,
        error: this.colors.red,
        debug: this.colors.magenta,
        success: this.colors.green,
      };

      return `${this.colors.bright}${timestamp}${this.colors.reset} ${colorMap[level]}${levelStr}${this.colors.reset} ${message}`;
    }

    return `${timestamp} ${levelStr} ${message}`;
  }

  info(message: string, data?: any) {
    console.log(this.formatMessage('info', message));
    if (data) console.log(data);
  }

  warn(message: string, data?: any) {
    console.warn(this.formatMessage('warn', message));
    if (data) console.warn(data);
  }

  error(message: string, error?: any) {
    console.error(this.formatMessage('error', message));
    if (error) {
      console.error(error);
      if (error.stack) console.error(error.stack);
    }
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage('debug', message));
      if (data) console.log(data);
    }
  }

  success(message: string, data?: any) {
    console.log(this.formatMessage('success', message));
    if (data) console.log(data);
  }
}

export default new Logger();
