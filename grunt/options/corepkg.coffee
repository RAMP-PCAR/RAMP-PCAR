module.exports = (grunt, options)->
    
    corepath = 'lib/ramp-pcar/'
    packagepath = 'lib/ramp-pcar/package.json'

    if grunt.file.exists packagepath
        corepkg = grunt.file.readJSON(packagepath)
        corepkg.corepath = corepath
    else
        corepkg = 
            corepath: '_/'

    return corepkg