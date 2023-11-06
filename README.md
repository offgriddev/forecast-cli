<div align="center">
  <h1>offgriddev/forecast-cli</h1>
  <div>
    <img src="https://github.com/offgriddev/forecast-cli/blob/main/docs/mascot.png" style="width: 45%" />
  </div>
  <div><br />Metrics-based tooling for predicting the future.</div>
  </br>
</div>

Forecast CLI is a metrics-based estimation tool used to predict a deadline for roadmap items based on the affect code changes have on the complexity of a system. Code Metrics are measurements of the current state of a system in terms of volume and complexity as it grows to meet business needs.

When we aggregate these and track them over time as code is committed, we can make realistic predictions on future development efforts based on the pace at which each member delivers code.

## Installation

Installing with `npm`:

`npm i -g forecast-cli`

Installing with `yarn`:

`yarn global add forecast-cli`

### Usage

#### Languages Supported

You can use any language that can be measured for Cyclomatic Complexity, or Logical Complexity.

#### Code Metric Model

Code Metrics must come in with a given format. The following is an MVP report that can consumed by the forecaster.

```json
{
  "totalComplexity": 3,
  "sha": "0a254a37f483dd1548f58130be3fe9f78fbad990",
  "actor": "participant-name",
  "branch": "refs/pull/148/merge",
  "analysis": [
    {
      "source": ".//apps/api-service/src/hello-world-lambda.ts",
      "metrics": {
        "functionName": {
          "complexity": 3
        },
        "anotherFunctionName": {
          "complexity": 1
        },
        "getOnwithIt": {
          "complexity": 1
        }
      }
    }
  ]
}
```

##### Data Location

Currently, you must download the code metrics from an S3 bucket in a `./data/commit-metrics` folder of a given working directory. This is currently hardcoded in until an AWS account for this is created.

#### Measuring Module Complexity by Module

Complexity is measured on a per-module basis. A module has the complexity of its most complex function.

Therefore, the `hello-world-lambda.ts` module above has a complexity of 3, not 5.

### Project Delivery Config

A config file must be loaded to leverage the estimate functionality in the CLI. The following is a breakdown of all the properties on the delivery config:

| Property                               | Type        | Description                                                               |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| startDate                              | Date String | The start date of the project or calculation                              |
| jira                                   | Object      | Jira configuration                                                        |
| jira.startSignal                       | String[]    | IDs for Jira Changelogs that represent the start of work for a given card |
| jira.epicKeys                          | String[]    | Jira Keys for the project epics                                           |
| jira.fields                            | Object[]    | Fields to map from Jira                                                   |
| jira.fields.from                       | string      | Field in Jira Issue to map to the estimate                                |
| jira.fields.to                         | string      | Field in datamodel to map to                                              |
| jira.repositories                      | string[]    | List of all repositories used for a given project                         |
| jira.participants                      | Object[]    | List of all participants in a given project                               |
| jira.participants.workableHours        | number      | Amount of hours developer is expected to work on the project              |
| jira.participants.username             | string      | GitHub username for participant                                           |
| jira.participants.daysUnavailable      | Object[]    | List of days dev will not be available for new work                       |
| jira.participants.daysUnavailable.from | string      | Beginning of participant unavailability                                   |
| jira.participants.daysUnavailable.to   | string      | End of participants unavailability                                        |

### Commands

The following is the primary list of supported commands:

#### forecast delivery <config-file>

This command creates a delivery projection for an entire project. It is used to provide an initial estimate and throughout the project. As work gets checked in, the algorithm will no longer distribute the card. So this provides a good barometer for internal time-to-deliver.

`forecast delivery ./infrastructure-initiative-config.json`

#### forecast commits print --repos <repos>

This command prints all the commits for a given set of repositories. It allows you to observe the measured growth of complexity in a given repository. This is the basis for metrics-based estimations.

`forecast commits print --repos forecast-cli`