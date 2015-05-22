module.exports = (grunt, options)->
    
    # core pkg always contains package data from RAMP core
    # in case of a RAMP theme, it additionally contains a path to the RAMP core dependency 

    corepath = 'lib/ramp-pcar/'
    corepackagepath = corepath + 'package.json'

    wetcorepath = 'lib/wet-boew/'
    
    pkg =        
        yuiconfig: {}
        core:
            path: null
            wet: null

        theme:
            path: null
            wet: null

    if grunt.file.exists corepackagepath
        pkg.isTheme = true
        
        pkg.core = grunt.file.readJSON(corepackagepath)

        pkg.core.path = corepath
        pkg.core.wet = wetcorepath

        pkg.theme = grunt.file.readJSON('package.json')
        pkg.theme.path = ''
        pkg.theme.wet = pkg.theme.ramp.themepath

        pkg.name = pkg.theme.name
        pkg.version = pkg.theme.version
        pkg.description = pkg.theme.description
        
        # store serve ports
        pkg.serve = pkg.theme.ramp.serve
    else
        pkg.isTheme = false
        
        pkg.core = grunt.file.readJSON('package.json')

        pkg.core.path = ''
        pkg.core.wet = wetcorepath

        pkg.theme.path =  '_/'
        pkg.theme.wet = '_/'

        pkg.name = pkg.core.name
        pkg.version = pkg.core.version
        pkg.description = pkg.core.description

        # store serve ports
        pkg.serve = pkg.core.ramp.serve

    # derive the series number
    pkg.series = 'v' + pkg.core.version.split('.').slice(0,2).join('.')# + '-dist'

    # read a yui config file from the core
    yuiconfigpath = pkg.core.path + 'yuidoc.json'
    if grunt.file.exists yuiconfigpath
        pkg.yuiconfig = grunt.file.readJSON(yuiconfigpath)

    # store package as grunt option
    grunt.option 'pkg', pkg

    return pkg




