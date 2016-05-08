"use strict";

var _ = require('lodash')
var axios = require('axios')
var homeLabConfig = require('./get-config')

module.exports = function (cb) {
  axios({
    method: 'get',
    url: 'https://api.teksavvy.com/web/Usage/UsageSummaryRecords?$filter=IsCurrent%20eq%20true',
    headers: {
      'TekSavvy-APIKey': homeLabConfig.teksavvyKey
    }
  })
    .then(function (response) {
      cb(null, _.last(response.data.value))
    })
    .catch(function (response) {
      cb(response)
    })
}