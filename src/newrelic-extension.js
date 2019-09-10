const R = require('ramda')
const { GraphQLExtension } = require('graphql-extensions')
const newrelic = require('newrelic')
const fieldTraceSummary = require('./field-trace-summary')

const errorCount = R.pipe(R.propOr([], 'errors'), R.length)

class NewRelicExtension extends GraphQLExtension {
  requestDidStart ({
    queryString,
    operationName,
    variables,
    persistedQueryHit
  }) {
    newrelic.setTransactionName(`graphql (${operationName})`)
    newrelic.addCustomAttribute('gqlQuery', queryString)
    newrelic.addCustomAttribute('gqlVars', JSON.stringify(variables))
  }

  willSendResponse ({ graphqlResponse }) {
    const tracingSummary = R.pipe(
      R.pathOr([], ['extensions', 'tracing']),
      fieldTraceSummary
    )(graphqlResponse)
    newrelic.addCustomAttribute('durationOfOperation', `${graphqlResponse.extensions.tracing.duration / 100000000} seconds`)
    newrelic.addCustomAttribute('traceSummary', tracingSummary)
    newrelic.addCustomAttribute('errorCount', errorCount(graphqlResponse))
  }
}

module.exports = NewRelicExtension
