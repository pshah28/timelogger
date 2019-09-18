import React, { Component } from 'react';
import './App.css';

class TimeLogger extends Component {
    state = {
      reminderInterval: "30"
    }
    onChange = e => {
      this.setState({ [e.target.name]: e.target.value });
      window.timer.set_interval(parseFloat(e.target.value))
    }
    render() {
        const {
          reminderInterval,
        } = this.state;
        return (
          <div style={{display:"flex", flexDirection: "column"}}>
            <select style={{height:"200px"}} multiple>
                {this.props.issues.map(function(name, index){
                    return <option key={ index }>{name}</option>;
                  })}
            </select>
            <button id="submittime">Submit Time</button>
            <div>remind every <input onChange={this.onChange} id="reminderInterval" name="reminderInterval" value={reminderInterval} /> minutes </div>
          </div>
        )
    }
}

export { TimeLogger };
