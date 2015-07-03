module.exports = (grunt) ->
    all:
        options:
            ignore:  [
                'The “details” element is not supported properly by browsers yet. It would probably be better to wait for implementations.'
                'Section lacks heading. Consider using “h2”-“h6” elements to add identifying headings to all sections.' # not a error, recommendation
                'Bad value “menuitem” for attribute “role” on element “a”.'
                'Attribute “ng-controller” not allowed on element “div” at this point.'
                'Attribute “ng-model” not allowed on element “input” at this point.'
                'Attribute “ng-change” not allowed on element “input” at this point.'
                'Attribute “ng-minlength” not allowed on element “input” at this point.'
                'Attribute “ng-repeat” not allowed on element “li” at this point.'
                'Attribute “ng-model” not allowed on element “select” at this point.'
                'Attribute “ng-options” not allowed on element “select” at this point.'
                'Attribute “ui-sref” not allowed on element “a” at this point.'
                'Attribute “ui-view” not allowed on element “div” at this point.'
            ]
        src: [
                'build/*.html'
                '!build/*-ckan.html'
        ]

    ajax:
        options:
            ignore: [
                'Element “head” is missing a required instance of child element “title”.'
                'Bad value “menuitem” for attribute “role” on element “a”.'
            ]
        src: [
            'build/ajax/**/*.html'
        ]
