import React from 'react';

export default function Settings(props) {
  const { timer, username, apikey, jql, jiraHost} = props.settings;
  return (
    <div className="Settings">
      <div>
        Notification Timer: <input type="number" onChange={(e) => props.onChange('timer', e.target.value)} value={timer}></input>
      </div>
      <div>
        Jira Host: <input onChange={(e) => props.onChange('jiraHost', e.target.value)} value={jiraHost}></input>
      </div>
      <div>
        Username: <input onChange={(e) => props.onChange('username', e.target.value)} value={username}></input>
      </div>
      <div>
        Jira Access Token: <input type="password" onChange={(e) => props.onChange('apikey', e.target.value)} value={apikey}></input>
      </div>
      <div>
        JQL: <input size="125" onChange={(e) => props.onChange('jql', e.target.value)} value={jql}></input>
      </div>
      <button className="btn" onClick={props.onSave}>Save Settings</button>
    </div>
  );
}