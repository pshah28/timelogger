import React, { Component } from 'react';
const { remote } = window.require('electron');

function Issue(props) {
  return (
    <li className={"TimeLogger-listItem" + (props.selected ? " is-selected" : "")}>
      <button onClick={() => props.onClick(props.issueKey)}>
        <div>
          {props.summary}
        </div>
        <div className="TimeLogger-listItemKey">
          {props.issueKey}
        </div>
      </button>
    </li>
  )
}

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

  onResetLastLogTime() {
    this.setState({ 
      currentTimestamp: new Date().getTime(),
      previousSubmitTimestamp: new Date().getTime(),
    });
  }


  primaryListContent(allIssues, unselectedIssues) {
    if (allIssues.length === 0) return <li>No items found. Please update your JQL or manually add an item.</li>
    if (unselectedIssues.length === 0 && Object.keys(this.state.selectedKeys).length === allIssues.length) return <li>:)</li>
    if (unselectedIssues.length === 0 && this.state.itemFilter) return <li>No items matching filter "{this.state.itemFilter}"</li>
    return unselectedIssues.filter(issue => !(issue.key in this.state.selectedKeys)).map((issue) => <Issue 
      onClick={this.onIssueClick.bind(this)}
      key={issue.key}
      issueKey={issue.key}
      selected={false}
      summary={issue.fields.summary} />);
  }

  render() {
    const allIssues = this.state.issues.concat(this.state.extraIssues);
    const filteredIssues = this.state.itemFilter ? allIssues.filter(issue => (issue.key + ' ' + issue.fields.summary).toLowerCase().includes(this.state.itemFilter.toLowerCase())) : allIssues;
    const unselectedIssues = filteredIssues.filter(issue => !(issue.key in this.state.selectedKeys));
    const selectedIssues = allIssues.filter(issue => issue.key in this.state.selectedKeys);
    const timeSinceLog = Math.floor((this.state.currentTimestamp - this.state.previousSubmitTimestamp) / 60000);

    return (
      <div className="TimeLogger" style={{ display: "flex", flexDirection: "column" }}>
        <div className="TimeLogger-controls">
          <div className="TimeLogger-control">
            <span className="label">Filter:</span> <input onChange={(e) => this.onFilterChange(e)} type="text"></input>
          </div>

          <span className="label">Add item:</span><input onChange={(e) => this.onAddItemChange(e)} value={this.state.addItemInput}></input>
          <button onClick={() => this.onAddKey()}>
            <img className="TimeLogger-icon" src="add.svg" alt="plus icon" />
          </button>



          <button className="TimeLogger-reload" onClick={() => this.loadJiraIssues()}>
            <img className="TimeLogger-icon" src="reload.svg" alt="refresh icon"/>
          </button>
        </div>

        <ul className={"TimeLogger-list TimeLogger-list--primary" + (unselectedIssues.length === 0 ? ' TimeLogger-list--noResults' : '')}>
          {this.primaryListContent(allIssues, unselectedIssues)}
        </ul>
        {selectedIssues.length > 0 && <ul className="TimeLogger-list TimeLogger-list--active">
          {selectedIssues.map((issue) => <Issue 
            key={issue.key}
            issueKey={issue.key}
            onClick={this.onIssueClick.bind(this)}
            selected={true}
            summary={issue.fields.summary}
          />)}
        </ul>}

        {selectedIssues.length > 0 && <div className="TimeLogger-bottomControls">
          <button className="btn_secondary" onClick={() => this.onClearSelection()}>
            Clear Selections
          </button>
        </div>}

        <div className="TimeLogger-btnWrapper">
          <button className="TimeLogger-submit btn" onClick={this.onSubmit.bind(this)}>
            Log Time
          </button>
        </div>

        <div className="TimeLogger-status">
          <div>
            <span className="label">Log this many minutes:</span>
            <input onChange={this.onTimeToLogChange.bind(this)} value={this.state.timeToLog} />
          </div>
          {this.state.previousSubmitTimestamp !== 0 &&
          <div className="TimeLogger-history">
            <span className="label">Minutes since last log:</span>
            {timeSinceLog}

            <div style={{marginLeft: '8px'}}>
              <button className="btn_secondary" onClick={() => this.onLogThisMuch(timeSinceLog)}>(use this amount)</button>
            </div>
            <div style={{marginLeft: '8px'}}>
              <button className="btn_secondary" onClick={() => this.onResetLastLogTime()}>(reset)</button>
            </div>
          </div>}
        </div>
      </div>
    )
  }
}