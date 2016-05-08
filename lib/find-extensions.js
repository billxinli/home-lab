"use strict";

var glob = require('glob')
var path = require('path')
var async = require('async')
var _ = require('lodash')
var inquirer = require('inquirer')

function findExtensions (currentPath, cb) {
  async.waterfall([
    function (cb) {
      glob('**/*', {cwd: currentPath}, cb)
    },
    function (files, cb) {
      var exts = _.reduce(files, function (extensions, file) {
        var ext = path.extname(file)
        if (!_.includes(extensions, ext) && _.trim(ext).length > 0) {
          extensions.push(ext)
        }
        return extensions
      }, [])
      cb(null, exts)
    },
    function (files, cb) {
      inquirer.prompt([
        {
          type: 'checkbox',
          name: 'ext',
          message: 'What extensions?',
          choices: files,
          default: ['.mkv']
        }
      ]).then(function (answers) {
        cb(null, answers)
      })
    },
    function (exts, cb) {

      glob('**/*.+(' + exts.ext.join('|').replace(/\./g, '') + ')', {cwd: currentPath}, cb)
    }
  ], cb)
}

module.exports = findExtensions