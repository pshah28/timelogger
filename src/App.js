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
const defaultTimer = 30;

class App extends Component {
  state = {
    interval: null,
    menuOpen: false,
    settings: {
      jiraHost: '',
      username: '',
      apikey: '',
      jql: defaultJQL,
      timer: defaultTimer,
    },
    settingsInputs: {
      jiraHost: '',
      username: '',
      apikey: '',
      jql: defaultJQL,
      timer: defaultTimer,
    },
  };

  componentDidMount() {
    const settings = remote.getCurrentWindow().loadSettings();
    this.setState({
      settings: {...settings, timer: parseInt(settings.timer, 10) > 0 ? parseInt(settings.timer, 10) : defaultTimer},
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

    this.setState((state) => {
      const updatedSettings = {
        ...state.settingsInputs,
        jql: state.settingsInputs.jql.trim() ? state.settingsInputs.jql : defaultJQL,
        timer: state.settingsInputs.timer > 0 ? state.settingsInputs.timer : defaultTimer,
      }
      remote.getCurrentWindow().saveSettings(updatedSettings);

      return {
        interval: setInterval(notify, updatedSettings.timer * 60 * 1000),
        menuOpen: false,
        settings: updatedSettings,
      }
    });
  }

  onHeaderMenuClick() {
    this.setState(state => {
      const settingsInputs = state.menuOpen ? state.settings : state.settingsInputs;
      settingsInputs.jql = settingsInputs.jql.trim() ? settingsInputs.jql : defaultJQL;
      settingsInputs.timer = settingsInputs.timer > 0 ? settingsInputs.timer : defaultTimer;

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
