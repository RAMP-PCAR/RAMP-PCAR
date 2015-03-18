module.exports = (grunt) -> 
    grunt.registerTask(
        'generateConfig'
        'INTERNAL: lints and generate language-specific configs from oneConfig and locale strings'
        [   
            'jsonlint:oneConfig'
            'zs3'
            'jsonlint:locales'
            'assembleConfigs'
        ]            
    )    