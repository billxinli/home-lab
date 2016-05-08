#!/usr/bin/env node

"use strict";

var colors = require('colors')
var exec = require('child_process').exec
var Table = require('cli-table')
var _ = require('lodash')
var disk = require('diskusage')
var path = require('path')
var async = require('async')
var homeLabConfig = require('../lib/get-config')
var byteCount = require('../lib/byte-count')

if (isNaN(process.env.SUDO_UID)) {
  console.log('You need to run this as root'.red)
  process.exit(1)
}

var mounts = _.get(homeLabConfig, 'fstab.mount')
var hostname = _.get(homeLabConfig, 'fstab.name')

async.waterfall([
  async.apply(function (mounts, cb) {
    async.map(mounts, function (mountRow, cb) {
      async.map(mountRow, function (mountCell, cb) {
        if (_.isUndefined(mountCell.uuid)) {
          return cb(null, mountCell)
        }
        var devUuid = path.join('/dev/disk/by-uuid/', mountCell.uuid)
        mountCell.devUuid = devUuid

        async.waterfall([
          function (cb) {
            exec(['smartctl -x -n standby -b ignore', devUuid].join(' '), function (err, stdout, stderr) {
              if (err && stdout.length === 0) {
                cb(err)
              } else {
                var smart = stdout.match(/SMART overall-health self-assessment test result: (.+?)\n/)
                mountCell.smart = smart[1]
                mountCell.smartExit = _.get(err, 'code', 0)
                cb(null, mountCell)
              }
            })
          },
          function (mountCell, cb) {
            exec(['hddtemp -n', devUuid].join(' '), function (err, stdout, stderr) {
              if (err) {
                cb(err)
              } else {
                mountCell.temperature = parseFloat(_.trim(stdout))
                cb(null, mountCell)
              }
            })
          },

          function (mountCell, cb) {
            disk.check(mountCell.path, function (err, disk) {
              if (err) {
                cb(err)
              } else {
                mountCell.total = disk.total
                mountCell.free = disk.free
                mountCell.used = disk.total - disk.free
                cb(null, mountCell)
              }
            })
          }
        ], cb)
      }, cb)
    }, cb)
  }, mounts),
  function (mounts, cb) {
    async.reduce(mounts, {total: 0, used: 0, free: 0}, function (total, mountRow, cb) {
      async.reduce(mountRow, total, function (total, mountCell, cb) {
        if (_.isUndefined(mountCell.uuid)) {
          return cb(null, total)
        }
        total.total += parseFloat(mountCell.total)
        total.used += parseFloat(mountCell.used)
        total.free += parseFloat(mountCell.free)
        cb(null, total)
      }, cb)
    }, function (err, results) {
      cb(err, {mounts: mounts, total: results})
    })
  }
], function (err, results) {
  var table = new Table({colWidths: [38, 38, 38, 38]})
  _.forEach(results.mounts, function (rowData) {
    var row = []
    _.forEach(rowData, function (cellData) {
      if (!_.isUndefined(cellData.uuid)) {
        var cell = [
          cellData.uuid.bold,
          ['Serial: ', cellData.serial].join(''),
          ['Mount: ', cellData.path].join(''),
          ['Free/U/T: ', byteCount(cellData.free, 1024), '/', byteCount(cellData.used, 1024), '/', byteCount(cellData.total, 1024)].join(''),
          ['Status: ', [
            (cellData.smart === 'PASSED') ? cellData.smart.green : cellData.smart.red,
            ((cellData.temperature <= 39)) ? cellData.temperature.toString().green : cellData.temperature.toString().red].join(' | ')].join('')
        ]
        row.push(cell.join('\n'))
      } else {
        row.push('N/A')
      }
    })
    table.push(row)
  })
  console.log('Host:', hostname)
  console.log(table.toString())
  console.log('Total:', byteCount(results.total.total, 1024))
  console.log('Used:', byteCount(results.total.used, 1024))
  console.log('Free:', byteCount(results.total.free, 1024))
})