#!/usr/bin/env node

const diskusage = require('diskusage')
const inquirer = require('inquirer')
const glob = require('glob')
const _ = require('lodash')
const async = require('async')
const fs = require('fs-extra')
const path = require('path')

const byteCount = require('./../lib/byte-count')
const copyDeleteSymlink = require('./../lib/copy-delete-symlink')
const searchMovie = require('./../lib/search-movies')
const nameCleaner = require('./../lib/filename-cleaner')

const cwd = process.cwd()

function isNotSampleFile (path, defaultSize, cb) {
  let _defaultSize = 1024 * 1024 * 1024

  if (!_.isUndefined(defaultSize)) {
    _defaultSize = defaultSize * 1024 * 1024
  }
  fs.stat(path, (err, results) => {
    if (err) {
      cb(err, true)
    } else {
      if (path.match(/sample/gi)) {
        cb(null, results.size > _defaultSize)
      } else {
        cb(null, true)
      }
    }
  })
}

function isNotSymlink (path, cb) {
  fs.lstat(path, (err, results) => {
    if (err) {
      cb(err, false)
    } else {
      cb(null, !results.isSymbolicLink())
    }
  })
}

var target = '/pool/movies/e'

function isNotExistingTarget (target, cb) {
  const fullPath = path.join(target.target, nameCleaner(target.name))
  fs.lstat(fullPath, (err, results) => {
    if (err) {
      cb(null, true)
    } else {
      cb(null, false)
    }
  })
}

async.waterfall([
  (cb) => glob('./**/*.+(' + [ 'mkv' ].join('|') + ')', { cwd: cwd }, cb),
  (files, cb) => async.map(files, (file, cb) => cb(null, path.join(cwd, file)), cb),
  (files, cb) => async.filter(files, isNotSymlink, cb),
  (files, cb) => async.filter(files, (file, cb) => isNotSampleFile(file, 1024, cb), cb),
  (files, cb) => {
    async.mapSeries(files, (file, cb) => {
      console.log('Processing: ', file)
      let questions = [
        {
          type: 'input',
          name: 'name',
          message: 'Movie name',
          default: function () {
            searchMovie(file, this.async())
          },
          validate: (value) => {
            return _.trim(value.length) > 0
          }
        }
      ]
      inquirer.prompt(questions)
        .then((answers) => {
          answers.source = file
          fs.lstat(file, (err, info) => {
            answers.size = info.size
            cb(null, answers)
          })

        })
    }, cb)
  },
  (files, cb) => {
    const potentialTargets = [
      '/pool/movies/a',
      '/pool/movies/b',
      '/pool/movies/c',
      '/pool/movies/d',
      '/pool/movies/e',
      '/pool/movies/f',
      '/pool/movies/g',
      '/pool/movies/h' ]

    async.waterfall([
      async.apply((potentialTargets, files, cb) => {
        async.map(potentialTargets, (target, cb) => {
            diskusage.check(target, (err, info) => {
              info.target = target
              cb(null, info)
            })
          },
          (err, results) => cb(err, results, files))
      }, potentialTargets, files),
      (potentialTargets, files, cb) => {
        _.forEach(files, (file) => {
          file.target = null
          _.forEach(potentialTargets, (potentialTarget) => {
            if (potentialTarget.available > file.size) {
              file.target = potentialTarget.target
              potentialTarget.available -= file.size
              return false
            }
          })
        })
        files = _.reduce(files, (files, file) => {
          if (file.target) {
            files.push(file)
          }
          return files
        }, [])
        cb(null, files)
      }
    ], cb)
  },
  (files, cb) => async.filter(files, isNotExistingTarget, cb),
  (files, cb) => setTimeout(() => cb(null, _.reject(files, (file) => { return file.name === 'skip' })), 1),
  (files, cb) => async.mapSeries(files, (file, cb) => copyDeleteSymlink(file.source, file.target, file.name, cb), cb)
], function (err, results) {
  console.log('=>', results)
  console.log('Error', err)
})
