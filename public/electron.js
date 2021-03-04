const { app, BrowserWindow } = require('electron');;
const { Settings } = require('./Settings');
const path = require("path");
const isDev = require("electron-is-dev");
var JiraApi = require('jira-client');
// Initialize
const baseJiraSettings = {
  protocol: 'https',
  host: '',
  username: '',
  password: '',
  apiVersion: '2',
  strictSSL: true,
}

let jiraHost = '';
let jiraUser = '';
let jiraPass = '';
let jiraClient;
function refreshJiraClient(settings) {
  const { username, apikey, jiraHost : host } = settings;
  if (username !== jiraUser || apikey !== jiraPass || jiraHost !== host) {
    jiraHost = host;
    jiraUser = username;
    jiraPass = apikey;
    jiraClient = new JiraApi(Object.assign(baseJiraSettings, {
      username,
      host,
      password: apikey,
    }))
  }
}

let mainWindow;
async function createWindow() {
  loadSettings();
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
  const resp = await jiraClient.searchJira(jql)
  return resp.issues;
}

function loadSettings() {
  const settings = new Settings();
  const settingsData = settings.get();
  refreshJiraClient(settingsData);
  return settingsData;
}

function saveSettings(data) {
  refreshJiraClient(data);
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