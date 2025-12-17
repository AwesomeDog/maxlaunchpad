import { app } from 'electron';
import log from 'electron-log';

import { LOG_FILE_PATH } from './paths';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

log.transports.file.resolvePathFn = () => LOG_FILE_PATH;
log.transports.file.level = isDev ? 'debug' : 'info';
log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

log.transports.console.level = isDev ? 'debug' : 'info';
log.transports.console.format = '[{h}:{i}:{s}.{ms}] [{level}] {text}';

// Serialize to single-line for easier log parsing
log.hooks.push((message) => {
  message.data = message.data.map((item) => {
    if (typeof item === 'string') {
      return item.replace(/\n/g, '\\n');
    }
    if (typeof item === 'object') {
      return JSON.stringify(item);
    }
    return item;
  });
  return message;
});

export default log;
