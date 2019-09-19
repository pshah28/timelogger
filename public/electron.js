const { app, BrowserWindow } = require('electron');;
const { Settings } = require('./Settings');
const path = require("path");
const isDev = require("electron-is-dev");
var JiraApi = require('jira-client');
// Initialize
const jira = new JiraApi({
  protocol: 'https',
  host: 'yexttest.atlassian.net',
  username: '',
  password: '',
  apiVersion: '2',
  strictSSL: true
});

let mainWindow;
async function createWindow() {
  mainWindow = new BrowserWindow({ width: 900 });
  mainWindow.loadIssues = loadIssues;
  mainWindow.logTime = logTime;
  mainWindow.loadSettings = loadSettings;
  mainWindow.saveSettings = saveSettings;
  mainWindow.loadURL(
    isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "../build/index.html")}`
  );
  mainWindow.on("closed", () => { mainWindow = null });
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

async function loadIssues(jql) {
  const resp = await jira.searchJira(jql)
  return resp.issues;
}

function loadSettings() {
  const settings = new Settings();
  return settings.get();
}

function saveSettings(data) {
  const settings = new Settings();
  settings.set(data);
}

const logTime = async (keys, minutes) => {
  const logged = [];
  const seconds = minutes * 60;
  const secondsPerItem = seconds / keys.length

  for (const key of keys) {
    try {
      await jira.addWorklog(key, { timeSpentSeconds: secondsPerItem });
      logged.push(key);
    } catch (err) {
      throw err
    }
  }
  return logged
}