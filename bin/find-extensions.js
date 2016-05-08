#!/usr/bin/env node

"use strict";

var findExtensions = require('./../lib/find-extensions')
var _ = require('lodash')
var cwd = process.cwd()

console.log('In', cwd)

findExtensions(cwd, function (err, results) {
  if (err) {
    console.err('Error' + err)
  } else {
    _.forEach(results, function (result) {
      console.log(result)
    })
  }
})

