module.exports = (bytes, unit) => {
  if (bytes < (unit = unit || 1000)) {
    return bytes + ' B'
  }
  const exp = Math.floor(Math.log(bytes) / Math.log(unit))
  const pre = ' ' + (unit === 1000 ? 'kMGTPE' : 'KMGTPE').charAt(exp - 1) + (unit === 1000 ? '' : 'i') + 'B'
  return (bytes / Math.pow(unit, exp)).toFixed(1) + pre
}
