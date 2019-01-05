const fs = require('fs-extra')
const path = require('path')
const nameCleaner = require('./filename-cleaner')

module.exports = (source, target, name, cb) => {
  name = nameCleaner(name)

  const newPath = [ target, name ].join('/')
  const newFile = [ target, name, [ name, path.extname(source) ].join('') ].join('/')

  const ensureDirectoryDoesNotExist = (path, cb) => {
    fs.stat(path, (err) => {
      if (err) {
        cb(null)
      } else {
        cb(new Error([ path, 'already exist' ].join('')))
      }
    })
  }

  const makeNewAssetDirectory = (path, cb) => {
    fs.mkdirs(path, (err) => {
      if (err) {
        cb(new Error([ path, 'failed creating directory' ].join('')))
      } else {
        cb(null, path)
      }
    })
  }

  const copyAsset = (from, to, cb) => {
    fs.copy(from, to, (err) => {
      if (err) {
        cb(new Error([ 'Failed copying file form', from, 'to', to ].join('')))
      } else {
        cb(null, from, to)
      }
    })
  }

  const deleteAsset = (path, cb) => {
    fs.unlink(path, (err) => {
      if (err) {
        cb(new Error([ 'Failed deleting', path ].join('')))
      } else {
        cb(null)
      }
    })
  }

  const createSymlink = (target, path, cb) => {
    fs.symlink(target, path, (err) => {
      if (err) {
        cb(new Error([ 'Failed creating symlink from', target, 'to', to ].join('')))
      } else {
        cb(null)
      }
    })
  }

  ensureDirectoryDoesNotExist(newPath, (err) => {
    if (err) {
      cb(err)
    } else {
      makeNewAssetDirectory(newPath, (err) => {
        if (err) {
          cb(err)
        } else {
          copyAsset(source, newFile, (err) => {
            if (err) {
              cb(err)
            } else {
              deleteAsset(source, (err) => {
                if (err) {
                  cb(err)
                } else {
                  createSymlink(newFile, source, (err) => {
                    if (err) {
                      cb(err)
                    } else {
                      cb(null)
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
  })
}
