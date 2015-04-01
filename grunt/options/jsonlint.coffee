module.exports = 
    oneConfig:
        src: [
            'src/config.json'
            'src/configSchema.json'
            'src/draft-04-schema.json'
        ]

    generatedConfigs:
        src: [
            'build/config.*.json'
        ]
        
    locales:
        src: [
            'src/locales/**/*.json'
        ]