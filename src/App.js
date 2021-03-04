import React, { Component } from 'react';
import TimeLogger from './TimeLogger';
import Header from './Header';
import Settings from './Settings';
import Initial from './Initial';
import './App.css';

const { remote } = window.require('electron');

const notify = () => {
    new Notification('Timelogger', {
      body: 'time to log',
      requireInteraction: true,
    })
  }

const defaultJQL = 'project in (PC, CR) AND assignee in (currentUser()) AND ((status changed to done during (startOfDay(-7d), startOfDay(-0d)) OR status changed to closed during (startOfDay(-7d), startOfDay(-0d))) OR status not in (closed, done)) OR key in (CO-442, CO-447) ORDER BY updated DESC';

class App extends Component {
  state = {
    interval: null,
    menuOpen: false,
    settings: {
      jiraHost: '',
      username: '',
      apikey: '',
      jql: defaultJQL,
      timer: 30,
    },
    settingsInputs: {
      jiraHost: '',
      username: '',
      apikey: '',
      jql: defaultJQL,
      timer: 30,
    },
  };

  componentDidMount() {
    const settings = remote.getCurrentWindow().loadSettings();
    this.setState({
      settings: {...settings, timer: parseInt(settings.timer, 10)},
      settingsInputs: settings,
      interval: setInterval(notify, settings.timer * 60 * 1000),
    });
  }

  onSettingChange(setting, value) {
    this.setState({ settingsInputs: { ...this.state.settingsInputs, [setting]: value } });
  }

  resetInterval() {
    if (this.state.interval) {
      clearInterval(this.state.interval);
    }
  }

  onSettingsSave() {
    this.resetInterval();
    remote.getCurrentWindow().saveSettings(this.state.settingsInputs);

    this.setState((state) => ({
      interval: setInterval(notify, state.settingsInputs.timer * 60 * 1000),
      menuOpen: false,
      settings: { 
        ...state.settingsInputs,
        jql: state.settingsInputs.jql.trim() ? state.settingsInputs.jql : defaultJQL,
      }
    }));
  }

  onHeaderMenuClick() {
    this.setState(state => {
      const settingsInputs = state.menuOpen ? state.settings : state.settingsInputs;
      settingsInputs.jql = settingsInputs.jql.trim() ? settingsInputs.jql : defaultJQL;

      return {
        menuOpen: !state.menuOpen,
        settingsInputs: settingsInputs,
      }
    });
  }

  requiredSettingsPresent() {
    return this.state.settings.username !== '' && this.state.settings.apikey !== '' && this.state.settings.jiraHost;
  }

  render() {
    return (
      <div className="App">
        <Header 
          onClick={this.onHeaderMenuClick.bind(this)}
          icon={this.state.menuOpen ? 'close' : 'settings'}/>
        <div className="App-body">
          {this.state.menuOpen && <Settings onChange={this.onSettingChange.bind(this)} onSave={this.onSettingsSave.bind(this)} settings={this.state.settingsInputs} />}
          {!this.requiredSettingsPresent() && <Initial />}
          {this.requiredSettingsPresent() && <TimeLogger onLogTime={this.resetInterval.bind(this)} jql={this.state.settings.jql} />}
        </div>
      </div>
    )
  }
}


export { App };
