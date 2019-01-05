const glob = require('glob')
const _ = require('lodash')
const fs = require('fs-extra')

function getTargetPath (source) {
  _.forEach('abcdefghijkl'.split(''), letter => {
    source = source.replace(`/movies/${letter}/`, `/movies/${letter}/movies/`)
  })
  return source
}

function skip (symlinked) {
  var skipit = false

  _.forEach('abcdefghijkl'.split(''), letter => {
    skipit = skipit || symlinked.indexOf(`/movies/${letter}/movies/`) > 0
  })

  return skipit

}

glob('/pool/torrents/a/ahd2/**/*.mkv', (err, files) => {
  // console.log(files)

  _.forEach(files, (movie) => {
    console.log('========================================================================')
    console.log(`Processing: ${movie}`)

    try {
      var realpath = fs.readlinkSync(movie)
      if (!skip(realpath)) {
        var sourcePath = realpath.split('/')
        sourcePath.pop()
        sourcePath = sourcePath.join('/')

        var targetPath = getTargetPath(sourcePath)

        var targetMoviePath = getTargetPath(realpath)

        console.log(`Moving from ${sourcePath} to ${targetPath}`)
        // fs.renameSync(sourcePath, targetPath)

        console.log(`Symlink ${movie} from ${realpath} to ${targetMoviePath}`)
        fs.unlinkSync(movie)
        fs.symlinkSync(targetMoviePath, movie)
      }
    } catch (err) {
      console.log(err)
    }
  })

})
