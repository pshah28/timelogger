const {autoUpdater} = require("electron-updater");
const log = require('electron-log')

class AppUpdater {
  constructor() {
    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = 'info';
    autoUpdater.allowPrerelease = true;
    log.info('App starting...');
    autoUpdater.checkForUpdatesAndNotify();
  }
}

module.exports = { AppUpdater };