const electron = require('electron');
const { app, BrowserWindow } = electron;
const path = require("path");
const isDev = require("electron-is-dev");
var JiraApi = require('jira-client');
const Configstore = require('configstore');
// Initialize
function createWindow() {
  let mainWindow = new TimeLoggerWindow({
    width: 900, 
    webPreferences: {
      nodeIntegration: false,
      preload: __dirname + '/preload.js'
    } });
  mainWindow.loadURL(
    isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "../build/index.html")}`
  );
  mainWindow.on("closed", () => { mainWindow = null });
}

class TimeLoggerWindow extends BrowserWindow {
  constructor(options) {
    super(options)
    this.config = new Configstore("timelogger");
    let settings = this.loadSettings()
    if (settings) {
      this.jira = new JiraApi({
        protocol: 'https',
        host: 'yexttest.atlassian.net',
        username: settings.username,
        password: settings.apikey,
        apiVersion: '2',
        strictSSL: true
      });
    }
  }
  
   async loadIssues(jql) {
      const resp = await this.jira.searchJira(jql)
      return resp.issues;
    }

    loadSettings() {
      let settings = this.config.get('settings')
      return settings ? settings : {timer:30}
    }

    saveSettings(data) {
      this.config.set('settings', data)
      this.jira = new JiraApi({
        protocol: 'https',
        host: 'yexttest.atlassian.net',
        username: data.username,
        password: data.apikey,
        apiVersion: '2',
        strictSSL: true
      })
    }

    async logTime(keys, minutes){
      const logged = [];
      const seconds = minutes * 60;
      const secondsPerItem = seconds / keys.length

      for (const key of keys) {
        try {
          await this.jira.addWorklog(key, { timeSpentSeconds: secondsPerItem });
          logged.push(key);
        } catch (err) {
          throw err
        }
      }
      return logged
    }
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
