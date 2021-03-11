import React from 'react';

export default function Header(props) {
  return (
    <div className="Header">
      <span className="Header-title">TimeLogger</span>
      <button onClick={props.onClick}>
        <img className="Header-icon" src={`${props.icon}.svg`} alt="gear icon" />
      </button>
    </div>
  )
}