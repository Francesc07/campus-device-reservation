// Bicep template for Monitoring, Alerts, and Observability
// Deploy with: az deployment group create --resource-group <rg-name> --template-file monitoring.bicep --parameters environment=dev

@description('Environment name (dev, test, prod)')
param environment string

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Function App resource ID')
param functionAppResourceId string

@description('Log Analytics Workspace resource ID')
param logAnalyticsWorkspaceId string

@description('Application Insights resource ID')
param appInsightsResourceId string

@description('Action Group email for alerts')
param alertEmailAddress string = 'alerts@example.com'

// Variables
var actionGroupName = 'devicereservation-${environment}-alerts-ag'
var alertRulePrefix = 'devicereservation-${environment}'

// Action Group for Alerts
resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: actionGroupName
  location: 'global'
  properties: {
    groupShortName: 'DevResAlrt'
    enabled: true
    emailReceivers: [
      {
        name: 'DevOpsTeam'
        emailAddress: alertEmailAddress
        useCommonAlertSchema: true
      }
    ]
  }
}

// Alert: Function Failures
resource functionFailuresAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${alertRulePrefix}-function-failures'
  location: 'global'
  properties: {
    description: 'Alert when function failure rate exceeds 5%'
    severity: 2
    enabled: true
    scopes: [
      functionAppResourceId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'FailureRate'
          metricName: 'Http5xx'
          operator: 'GreaterThan'
          threshold: 5
          timeAggregation: 'Count'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Alert: High Response Time
resource highResponseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${alertRulePrefix}-high-response-time'
  location: 'global'
  properties: {
    description: 'Alert when average response time exceeds 3 seconds'
    severity: 3
    enabled: true
    scopes: [
      functionAppResourceId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ResponseTime'
          metricName: 'HttpResponseTime'
          operator: 'GreaterThan'
          threshold: 3000  // 3 seconds in ms
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Alert: High CPU Usage
resource highCpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${alertRulePrefix}-high-cpu'
  location: 'global'
  properties: {
    description: 'Alert when CPU usage exceeds 80%'
    severity: 2
    enabled: true
    scopes: [
      functionAppResourceId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'CpuPercentage'
          metricName: 'CpuPercentage'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Alert: Memory Usage
resource highMemoryAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${alertRulePrefix}-high-memory'
  location: 'global'
  properties: {
    description: 'Alert when memory usage exceeds 85%'
    severity: 2
    enabled: true
    scopes: [
      functionAppResourceId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'MemoryPercentage'
          metricName: 'MemoryPercentage'
          operator: 'GreaterThan'
          threshold: 85
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Alert: Function Availability
resource availabilityAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${alertRulePrefix}-availability'
  location: 'global'
  properties: {
    description: 'Alert when function availability drops below 99%'
    severity: 1
    enabled: true
    scopes: [
      appInsightsResourceId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'Availability'
          metricName: 'availabilityResults/availabilityPercentage'
          operator: 'LessThan'
          threshold: 99
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Scheduled Query Alert: Exception Rate
resource exceptionRateAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: '${alertRulePrefix}-exception-rate'
  location: location
  properties: {
    description: 'Alert when exception rate exceeds 10 per minute'
    severity: 2
    enabled: true
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    scopes: [
      logAnalyticsWorkspaceId
    ]
    criteria: {
      allOf: [
        {
          query: '''
            exceptions
            | where cloud_RoleName == "devicereservation-${environment}-ab07-func"
            | summarize ExceptionCount = count() by bin(timestamp, 1m)
            | where ExceptionCount > 10
          '''
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [
        actionGroup.id
      ]
    }
  }
}

// Outputs
output actionGroupId string = actionGroup.id
output actionGroupName string = actionGroup.name
