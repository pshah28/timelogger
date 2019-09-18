const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require("path");
const isDev = require("electron-is-dev");
var JiraApi = require('jira-client');
// Initialize
var jira  = new JiraApi({
  protocol: 'https',
  host: 'yexttest.atlassian.net',
  username: '',
  password: '',
  apiVersion: '2',
  strictSSL: true
});;
let mainWindow;
async function createWindow() {
  mainWindow = new BrowserWindow({ width: 900, height: 680 });
  mainWindow.issues = await getTicketKeys()
  mainWindow.logTime = logTime
  mainWindow.loadURL(
    isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "../build/index.html")}`
  );
  mainWindow.refresh = async function(){
    console.log("refresh")
    this.issues = await getTicketKeys()
    console.log("show")
    this.show()
  }
  mainWindow.on("closed", () => {mainWindow = null});
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

async function getTicketKeys() {
  p = await jira.searchJira("project = PC AND assignee in (currentUser()) AND (status changed to closed during (startOfDay(-7d), startOfDay(-0d)) OR status != closed) ORDER BY updated DESC")
  array = []
    for (obj of p.issues) {
      array.push(obj.key + ": " + obj.fields.summary)
    }
  return array
}

async function logTime(tickets) {
  var re = /PC-\d*/g;
  let logged = []
  let seconds = 1800/tickets.length
  for (let ticket of tickets) {
    let pcNo = ticket.match(re)
    try {
      let resp = await jira.addWorklog(pcNo, {timeSpentSeconds: seconds})
      logged.push(pcNo)
    } catch (err) {
      throw err
    }
  }
  return logged
}