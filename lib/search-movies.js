"use strict";

var _ = require('lodash')
var homeLabConfig = require('./get-config')
var movieDB = require('moviedb')(homeLabConfig.tmdbKey)

module.exports = function (nameOrPath, cb) {
  var segments = _.last(nameOrPath.split('/')).split(/\d{4}/)
  var name = _.first(segments).replace(/\./g, ' ')

  movieDB.searchMovie({query: name}, function (err, data) {
    if (err) {
      cb(null, '')
    } else {
      var result = _.first(data.results)
      if (result) {
        var title = _.get(result, 'title')
        var year = _.first(_.get(result, 'release_date').split('-'))
        cb(null, _.trim(title + ' (' + year + ')'))
      } else {
        cb(null, '')
      }
    }
  })
}