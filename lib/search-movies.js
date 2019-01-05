'use strict'

const _ = require('lodash')
const homeLabConfig = require('./get-config')
const movieDB = require('moviedb')(homeLabConfig.tmdbKey)

module.exports = (nameOrPath, cb) => {
  const segments = _.last(nameOrPath.split('/')).split(/\d{4}/)
  const name = _.first(segments).replace(/\./g, ' ')

  movieDB.searchMovie({ query: name }, (err, data) => {
    if (err) {
      cb(null, '')
    } else {
      const result = _.first(data.results)
      if (result) {
        const title = _.get(result, 'title')
        const year = _.first(_.get(result, 'release_date').split('-'))
        cb(null, _.trim(title + ' (' + year + ')'))
      } else {
        cb(null, '')
      }
    }
  })
}
