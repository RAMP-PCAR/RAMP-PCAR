module.exports = (grunt)->
    pkg = grunt.file.readJSON('package.json')
    pkg.series = 'v' + pkg.version.split('.').slice(0,2).join('.') + '-dist'

    return pkg