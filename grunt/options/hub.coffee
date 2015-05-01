module.exports = 
    'wet-boew':
        src: [
            'lib/wet-boew/Gruntfile.coffee'
        ]
        tasks: [
            'checkDependencies'
            'test'
            'build'
            'minify'
            'i18n_csv:assemble'
        ]