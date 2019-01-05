'use strict'

const osHomedir = require('os-homedir')
const fs = require('fs-extra')
const path = require('path')
const config = path.join(osHomedir(), '.home-lab.json')

try {
  module.exports = fs.readJsonSync(config, { throws: false })
} catch (e) {
  module.exports = {}
}
