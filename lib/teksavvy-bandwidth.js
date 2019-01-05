'use strict'

const _ = require('lodash')
const axios = require('axios')
const homeLabConfig = require('./get-config')

module.exports = (cb) => {
  axios(
    {
      method: 'get',
      url: 'https://api.teksavvy.com/web/Usage/UsageSummaryRecords?$filter=IsCurrent%20eq%20true',
      headers: {
        'TekSavvy-APIKey': homeLabConfig.teksavvyKey
      }
    })
    .then((response) => cb(null, _.last(response.data.value)))
    .catch((response) => cb(response))
}
