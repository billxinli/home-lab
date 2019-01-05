#!/usr/bin/env node

'use strict'

const colors = require('colors')
const exec = require('child_process').exec
const Table = require('cli-table')
const _ = require('lodash')
const disk = require('diskusage')
const path = require('path')
const async = require('async')
const homeLabConfig = require('../lib/get-config')
const byteCount = require('../lib/byte-count')

if (isNaN(process.env.SUDO_UID)) {
  console.log('You need to run this as root'.red)
  process.exit(1)
}

const mounts = _.get(homeLabConfig, 'fstab.mount')
const hostname = _.get(homeLabConfig, 'fstab.name')

async.waterfall([
  async.apply((mounts, cb) => {
    async.map(mounts, (mountRow, cb) => {
      async.map(mountRow, (mountCell, cb) => {
        if (_.isUndefined(mountCell.uuid)) {
          return cb(null, mountCell)
        }

        const devUuid = path.join('/dev/disk/by-uuid/', mountCell.uuid)
        mountCell.devUuid = devUuid

        async.waterfall([
          (cb) => {
            exec([ 'smartctl -x -n standby -b ignore', devUuid ].join(' '), (err, stdout, stderr) => {
              if (err && stdout.length === 0) {
                cb(err)
              } else {
                const smart = stdout.match(/SMART overall-health self-assessment test result: (.+?)\n/)
                if (smart) {
                  mountCell.smart = smart[ 1 ]
                } else {
                  mountCell.smart = 'FAIL'
                }
                mountCell.smartExit = _.get(err, 'code', 0)
                cb(null, mountCell)
              }
            })
          },
          (mountCell, cb) => {
            exec([ 'hddtemp -n', devUuid ].join(' '), (err, stdout, stderr) => {
              if (err) {
                cb(err)
              } else {
                mountCell.temperature = parseFloat(_.trim(stdout))
                cb(null, mountCell)
              }
            })
          },

          (mountCell, cb) => {
            disk.check(mountCell.path, (err, disk) => {
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
  (mounts, cb) => {
    async.reduce(mounts, { total: 0, used: 0, free: 0 },
      (total, mountRow, cb) => {
        async.reduce(mountRow, total, (total, mountCell, cb) => {
          if (_.isUndefined(mountCell.uuid)) {
            return cb(null, total)
          }
          total.total += parseFloat(mountCell.total)
          total.used += parseFloat(mountCell.used)
          total.free += parseFloat(mountCell.free)
          cb(null, total)
        }, cb)
      },
      (err, results) => {
        cb(err, { mounts: mounts, total: results })
      })
  }
], (err, results) => {
  const table = new Table({ colWidths: [ 38, 38, 38, 38 ] })
  _.forEach(results.mounts, (rowData) => {
    let row = []
    _.forEach(rowData, (cellData) => {
      if (!_.isUndefined(cellData.uuid)) {
        let cell = [
          cellData.uuid.bold,
          [ 'Serial: ', cellData.serial ].join(''),
          [ 'Mount: ', cellData.path ].join(''),
          [ 'Free/U/T: ', byteCount(cellData.free, 1024), '/', byteCount(cellData.used, 1024), '/', byteCount(cellData.total, 1024) ].join(''),
          [ 'Status: ', [
            (cellData.smart === 'PASSED') ? cellData.smart.green : cellData.smart.red,
            ((cellData.temperature <= 39)) ? cellData.temperature.toString().green : cellData.temperature.toString().red ].join(' | ') ].join('')
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
