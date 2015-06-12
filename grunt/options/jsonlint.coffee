module.exports = 
    oneConfig:
        src: [
            'build/config.json'
            '<%= pkg.core.path %>src/configSchema.json'
            '<%= pkg.core.path %>src/draft-04-schema.json'
        ]

    generatedConfigs:
        src: [
            'build/config.*.json'
        ]
        
    locales:
        src: [
            'src/locales/**/*.json'
        ]

    mergedLocales:
        src: [
            'build/locales/**/*.json'
        ]

    bower:
        src: [
            'bower.json'
        ]