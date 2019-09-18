import React from 'react';
import ReactDOM from 'react-dom';
import { TimeLogger } from './App';
import './index.css';
const { remote } = window.require('electron');
ReactDOM.render(<TimeLogger issues={remote.getCurrentWindow().issues}/>, document.getElementById('root'));
let submitTimeButton = document.getElementById('submittime')
submitTimeButton.addEventListener('click', async function(){
    let els = [...document.querySelectorAll('option:checked')]
    let issues = els.map(el => el.text)
    try {
        let resp  = await remote.getCurrentWindow().logTime(issues)
        window.alert("logged time to " + resp.join(","))
    } catch (err) {
        console.log(err)
        window.alert("Failed to submit time, check dev console")
    }
})

async function refreshTickets() {
    await remote.getCurrentWindow().refresh()
    ReactDOM.render(<TimeLogger issues={remote.getCurrentWindow().issues}/>, document.getElementById('root'));
}

window.timer = {
    running: false,
    min: 30,
    timeout: false,
    cb: function () { },
    start: function (cb, min) {
        var elm = this;
        clearInterval(this.timeout);
        this.running = true;
        if (cb) this.cb = cb;
        if (min) this.min = min;
        this.timeout = setTimeout(function () { elm.execute(elm) }, this.to_ms(this.min));
    },
    execute: function (e) {
        if (!e.running) return false;
        e.cb();
        e.start();
    },
    stop: function () {
        this.running = false;
    },
    set_interval: function (min) {
        clearInterval(this.timeout);
        this.start(false, min);
        console.log(this.min)
    },
    to_ms: function (min) {
        return min * 60 * 1000
    }
};

window.timer.start(refreshTickets, 30)
