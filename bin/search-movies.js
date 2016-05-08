#!/usr/bin/env node

"use strict";

var searchMovies = require('./../lib/search-movies')
var _ = require('lodash')

searchMovies(process.argv[2], function (err, result) {
  if (err) {
    console.err('Error' + err)
  } else {
    console.log(result)
  }
})

