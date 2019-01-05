'use strict'

const glob = require('glob')
const path = require('path')
const async = require('async')
const _ = require('lodash')
const inquirer = require('inquirer')

function findExtensions (currentPath, cb) {
  async.waterfall([
    (cb) => glob('**/*', { cwd: currentPath }, cb),
    (files, cb) => {
      const exts = _.reduce(files, (extensions, file) => {
        const ext = path.extname(file)
        if (!_.includes(extensions, ext) && _.trim(ext).length > 0) {
          extensions.push(ext)
        }
        return extensions
      }, [])
      cb(null, exts)
    },
    (files, cb) => {
      inquirer.prompt([
        {
          type: 'checkbox',
          name: 'ext',
          message: 'What extensions?',
          choices: files,
          default: [ '.mkv' ]
        }
      ])
        .then((answers) => cb(null, answers))
    },
    (exts, cb) => glob('**/*.+(' + exts.ext.join('|').replace(/\./g, '') + ')', { cwd: currentPath }, cb)
  ], cb)
}

module.exports = findExtensions
