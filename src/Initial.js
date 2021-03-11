import React from 'react';

function ListItem(heading, description, key) {
  return (
    <li key={key} className="Initial-listItem">
      <div className="Initial-listItemHeading">
        {heading}
      </div>
      <div className="Initial-listItemDescription">
        {description}
      </div>
    </li>
  )
}

export default function Initial(props) {
  const requiredSettings = [
    {
      heading: 'Jira Host',
      description: 'This will be something like [companyName].atlassian.net if you\'re using an Atlassian hosted Jira instance',
    },
    {
      heading: 'Jira Username',
      description: 'The email you use to sign in to Jira. Probably something like [jSmith]@[company].com',
    },
    {
      heading: 'Jira Api Token',
      description: 'Visit this url in your browser to create an api token: https://id.atlassian.com/manage-profile/security/api-tokens',
    }
  ];
  return (
    <div className="Initial">
      <div className="Initial-main">
        Certain settings are required for the application to function. Please use the gear icon to access the settings menu and provide:
      </div>
      <ul className="Initial-list">
        {requiredSettings.map((item, i) => ListItem(item.heading, item.description, i))}
      </ul>
    </div>
  )
}