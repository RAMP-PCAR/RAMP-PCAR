module.exports =
    options:
        data: [
            "lib/wet-boew/site/data/**/*.{yml,json}"
            "site/data/**/*.{yml,json}"
        ]
        helpers: [
            "lib/wet-boew/site/helpers/helper-*.js"
            "site/helpers/helper-*.js"
        ]
        partials: [
            "lib/wet-boew/site/includes/**/*.hbs"
            "site/includes/**/*.hbs"
        ]
        layoutdir: "site/layouts"
        layout: "default.hbs"

        i18next:
            countryCode: 'CA'
            debug: false
            localePath: 'src/locales'
            languages: ['en', 'fr']

    ramp:
        options:
            assets: 'build/js/lib/wet-boew'
            rampAssets: 'assets'

            environment:
                jqueryVersion: '2.1.1'
                #jqueryVersion: "<%= jqueryVersion.version %>"
                #jqueryOldIEVersion: "<%= jqueryOldIEVersion.version %>"
            flatten: true
            plugins: ['assemble-contrib-i18n']
            i18n:
                languages: ['en', 'fr']
                templates: [
                    'site/pages/ramp.hbs'
                    'site/pages/error.hbs'
                ]
        dest: 'build/'
        src: '!*.*'

    ajax:
        options:
            flatten: true
            plugins: ['assemble-contrib-i18n']
            i18n:
                languages: ['en', 'fr']
                templates: [
                    'site/pages/ajax/*.hbs'
                ]
        dest: 'build/ajax/'
        src: '!*.*'
