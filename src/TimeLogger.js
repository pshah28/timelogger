import React, { Component } from 'react';
const { remote } = window.require('electron');

export default class TimeLogger extends Component {
  state = {
    issues: [],
    extraIssues: [],
    extraKeys: [],
    selectedKeys: {},
    itemFilter: '',
    addItemInput: '',
    timeToLog: 30,
    previousSubmitTimestamp: 0,
    currentTimestamp: 0,
    interval: null,
  }

  componentDidMount() {
    this.loadJiraIssues();
  }

  async onSubmit() {
    const keys = this.state.selectedKeys;
    if (!Object.keys(keys).length) return alert("Must select items to log to");
    const resp = await remote.getCurrentWindow().logTime(Object.keys(keys), this.state.timeToLog)
    const timestamp = new Date().getTime();
    this.setState({
      currentTimestamp: timestamp,
      previousSubmitTimestamp: timestamp,
    });
    if (!this.state.timeout) {
      this.setState({
        interval: setInterval(
          () => {
            this.setState({ currentTimestamp: new Date().getTime() })
          }, 60000
        )
      });
    }
    window.alert("logged time to " + resp.join(', '));
  }

  onAddItemChange(e) {
    this.setState({ addItemInput: e.target.value });
  }

  async onAddKey() {
    if (!this.state.addItemInput) return alert("Input cannot be empty");

    const extraKeys = this.state.extraKeys.concat(this.state.addItemInput);

    let extraIssues = [];
    if (extraKeys.length) {
      extraIssues = await remote.getCurrentWindow().loadIssues(`issuekey in (${extraKeys.join(',')})`);
    }

    this.setState({
      addItemInput: '',
      extraKeys,
      extraIssues,
    });
  }

  onIssueClick(key) {
    if (key in this.state.selectedKeys) {
      const selectedKeysWithoutKey = { ...this.state.selectedKeys };
      delete selectedKeysWithoutKey[key];
      this.setState({ selectedKeys: selectedKeysWithoutKey });
    } else {
      this.setState({ selectedKeys: { ...this.state.selectedKeys, [key]: true } });
    }
  }

  async loadJiraIssues() {
    console.log("LOADING JIRA: ", this.props.jql);
    const issues = await remote.getCurrentWindow().loadIssues(this.props.jql);
    let extraIssues = [];
    if (this.state.extraKeys.length) {
      extraIssues = await remote.getCurrentWindow().loadIssues(`issuekey in (${this.state.extraKeys.join(',')})`);
    }
    this.setState({ issues, extraIssues });
  }

  onTimeToLogChange(e) {
    this.setState({ timeToLog: e.target.value });
  }

  onClearSelection() {
    this.setState({ selectedKeys: {} });
  }

  onFilterChange(e) {
    this.setState({ itemFilter: e.target.value });
  }

  onLogThisMuch(amt) {
    this.setState({ timeToLog: amt });
  }

  render() {
    const allIssues = this.state.issues.concat(this.state.extraIssues);
    const issues = this.state.itemFilter ? allIssues.filter(issue => (issue.key + ' ' + issue.fields.summary).toLowerCase().includes(this.state.itemFilter.toLowerCase())) : allIssues;
    const timeSinceLog = Math.floor((this.state.currentTimestamp - this.state.previousSubmitTimestamp) / 60000);

    return (
      <div className="Timelogger" style={{ display: "flex", flexDirection: "column" }}>
        <div className="Timelogger-controls">
          <div className="Timelogger-control">
            <span className="label">Filter:</span> <input onChange={(e) => this.onFilterChange(e)} type="text"></input>
          </div>

          <span className="label">Add item:</span><input onChange={(e) => this.onAddItemChange(e)} value={this.state.addItemInput}></input>
          <button onClick={() => this.onAddKey()}>
            <img className="Timelogger-icon" src="add.svg" alt="plus icon" />
          </button>



          <button className="Timelogger-reload" onClick={() => this.loadJiraIssues()}>
            <img className="Timelogger-icon" src="reload.svg" alt="refresh icon"/>
          </button>
        </div>

        <ul className="Timelogger-list">
          {issues.map((issue) => {
            return <li className={"Timelogger-listItem" + (issue.key in this.state.selectedKeys ? " is-selected" : "")} key={issue.key}>
              <button onClick={() => this.onIssueClick(issue.key)}>
                <div>
                  {issue.fields.summary}
                </div>
                <div className="Timelogger-listItemKey">
                  {issue.key}
                </div>
              </button>
            </li>;
          })}
        </ul>

        <div className="Timelogger-bottomControls">
          <button className="btn_secondary" onClick={() => this.onClearSelection()}>
            Clear Selections
          </button>
        </div>

        <div className="Timelogger-btnWrapper">
          <button className="Timelogger-submit btn" onClick={this.onSubmit.bind(this)}>
            Log Time
          </button>
        </div>

        <div className="Timelogger-status">
          <div>
            <span className="label">Log this many minutes:</span>
            <input onChange={this.onTimeToLogChange.bind(this)} value={this.state.timeToLog} />
          </div>
          {this.state.previousSubmitTimestamp !== 0 &&
          <div className="Timelogger-history">
            <span className="label">Minutes since last log:</span>
            {timeSinceLog}

            <div style={{marginLeft: '8px'}}>
              <button className="btn_secondary" onClick={() => this.onLogThisMuch(timeSinceLog)}>(use this amount)</button>
            </div>
          </div>}
        </div>
      </div>
    )
  }
}