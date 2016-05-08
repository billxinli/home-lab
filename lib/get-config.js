"use strict";

var osHomedir = require('os-homedir')
var fs = require('fs-extra')
var path = require('path')
var config = path.join(osHomedir(), '.home-lab.json')

try {
  module.exports = fs.readJsonSync(config, {throws: false})
} catch (e) {
  module.exports = {}
}