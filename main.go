package main

import (
	"encoding/json"
	"fmt"
	"github.com/andygrunwald/go-jira"
	"github.com/zserge/lorca"
	"log"
	"os"
	"regexp"
)

var (
	jiraUsername string
	jiraClient   *jira.Client
	ui           lorca.UI
	addr         string
	err          error
)

func init() {
	s := GetSettings()
	if s != nil {
		jiraClient, _ = jira.NewClient(nil, "https://yexttest.atlassian.net/")
		jiraClient.Authentication.SetBasicAuth(s.Username, s.Apikey)
	}
}

func main() {
	ui, _ = lorca.New("", "", 480, 320)
	// Bind Go function to be available in JS. Go function may be long-running and
	// blocking - in JS it's represented with a Promise.
	ui.Bind("add", func(a, b int) int { return a + b })
	ui.Bind("loadIssues", loadIssues)
	ui.Bind("logTime", logTime)
	ui.Bind("saveSettings", SaveSettings)
	ui.Bind("getSettings", GetSettings)

	addr, err = serve()
	if err != nil {
		log.Fatal(err)
	}
	ui.Load(addr)

	// Call JS function from Go. Functions may be asynchronous, i.e. return promises
	n := ui.Eval(`Math.random()`).Float()
	fmt.Println(n)

	// Call JS that calls Go and so on and so on...
	m := ui.Eval(`new Notification("hello"`).Int()
	fmt.Println(m)

	// Wait for the browser window to be closed
	<-ui.Done()
}

func loadIssues(jql string) ([]jira.Issue, error) {
	if jiraClient != nil {
		if jql == "" {
			jql = "project = PC AND assignee in (currentUser()) AND (status changed to closed during (startOfDay(-7d), startOfDay(-0d)) OR status != closed) ORDER BY updated DESC"
		}
		is, _, err := jiraClient.Issue.Search(jql, nil)
		return is, err
	}
	return nil, fmt.Errorf("jira not logged in")
}

func logTime(issues []string, minutes float64) []string {
	re := regexp.MustCompile(`PC-\d*`)
	logged := []string{}
	seconds := minutes * 60
	for _, p := range issues {
		no := re.FindString(p)
		_, _, err := jiraClient.Issue.AddWorklogRecord(no, &jira.WorklogRecord{
			TimeSpentSeconds: int(seconds),
		})
		if err == nil {
			logged = append(logged, no)
		}
		log.Println(err)
	}
	return logged
}

type Settings struct {
	Username string  `json:"username,omitempty"`
	Apikey   string  `json:"apikey,omitempty"`
	Jql      string  `json:"jql,omitempty"`
	Timer    float64 `json:"timer,omitempty"`
}

func SaveSettings(s *Settings) error {
	jiraClient, _ = jira.NewClient(nil, "https://yexttest.atlassian.net/")
	jiraClient.Authentication.SetBasicAuth(s.Username, s.Apikey)
	f, err := os.Create("config.json")
	f.Truncate(0)
	marshalled, err := json.Marshal(s)
	f.Write(marshalled)
	return err
}

func GetSettings() *Settings {
	var s = &Settings{}
	f, err := os.Open("config.json")
	if err != nil {
		return nil
	}
	err = json.NewDecoder(f).Decode(s)
	return s
}
