module.exports =
    options:
        data: [
            '<%= pkg.core.wet %>site/data/**/*.{yml,json}'
            '<%= pkg.core.path %>site/data/**/*.{yml,json}'
            '<%= pkg.theme.wet %>site/data/**/*.{yml,json}'
            '<%= pkg.theme.path %>site/data/**/*.{yml,json}'
        ]
        helpers: [
            '<%= pkg.core.wet %>site/helpers/helper-*.js'
            '<%= pkg.core.path %>site/helpers/helper-*.js'
            '<%= pkg.theme.wet %>site/helpers/helper-*.js'
            '<%= pkg.theme.path %>site/helpers/helper-*.js'
        ]
        partials: [
            '<%= pkg.core.wet %>site/includes/**/*.hbs'
            '<%= pkg.core.path %>site/includes/**/*.hbs'
            '<%= pkg.theme.wet %>site/includes/**/*.hbs'
            '<%= pkg.theme.path %>site/includes/**/*.hbs'
        ]
        layoutdir: 'site/layouts'
        layout: 'default.hbs'

        i18next:
            countryCode: 'CA'
            debug: false
            localePath: 'build/locales'
            languages: '<%= pkg.core.ramp.locale.languages %>'
            #languages: ['en', 'fr']

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
                languages: '<%= pkg.core.ramp.locale.languages %>'
                templates: [
                    'site/pages/ramp.hbs'
                    'site/pages/error.hbs'
                ]
        dest: 'build/'
        src: '!*.*'

    ajaxCore:
        options:
            layoutdir: '<%= pkg.core.path %>site/layouts'
            flatten: true
            plugins: ['assemble-contrib-i18n']
            i18n:
                languages: '<%= pkg.core.ramp.locale.languages %>'
                templates: [
                    '<%= pkg.core.path %>site/pages/ajax/*.hbs'
                ]
        dest: 'build/ajax/'
        src: '!*.*'

    ajaxWetTheme:
        options:
            layoutdir: '<%= pkg.theme.wet %>site/layouts'
            flatten: true
            plugins: ['assemble-contrib-i18n']
            i18n:
                languages: '<%= pkg.core.ramp.locale.languages %>'
                templates: [
                    '<%= pkg.theme.wet %>site/pages/ajax/*.hbs'
                ]
        dest: 'build/ajax/'
        src: '!*.*'

    ajaxTheme:
        options:
            layoutdir: '<%= pkg.theme.path %>site/layouts'
            flatten: true
            plugins: ['assemble-contrib-i18n']
            i18n:
                languages: '<%= pkg.core.ramp.locale.languages %>'
                templates: [
                    '<%= pkg.theme.path %>site/pages/ajax/*.hbs'
                ]
        dest: 'build/ajax/'
        src: '!*.*'