#!/usr/bin/env node

'use strict'

const teksavvyBandwidth = require('./../lib/teksavvy-bandwidth')
const colors = require('colors')
const _ = require('lodash')

teksavvyBandwidth((err, result) => {
  if (err) {
    console.err('Error' + err)
  } else {
    console.log('ISP Bandwidth Usage'.green)
    console.log('From:', result.StartDate, 'to', result.EndDate)
    console.log('On Peak Upload:', result.OnPeakUpload, 'GiB')
    console.log('On Peak Download:', result.OnPeakDownload, 'GiB')
    console.log('Off Peak Upload:', result.OffPeakUpload, 'GiB')
    console.log('Off Peak Download:', result.OffPeakDownload, 'GiB')
    console.log('Total Bandwidth:', (result.OnPeakUpload + result.OnPeakDownload + result.OffPeakUpload + result.OffPeakDownload).toFixed(2), 'GiB')
  }
})

