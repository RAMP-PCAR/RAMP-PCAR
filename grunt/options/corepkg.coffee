module.exports = (grunt, options)->
    
    corepath = 'lib/ramp-pcar/'
    packagepath = 'lib/ramp-pcar/package.json'
    
    if grunt.file.exists packagepath
        corepkg = grunt.file.readJSON(packagepath)
        corepkg.corepath = corepath
        corepkg.isTheme = true

    else
        corepkg = 
            corepath: '_/'
            isTheme: false

    grunt.option 'corepkg', corepkg

    return corepkg