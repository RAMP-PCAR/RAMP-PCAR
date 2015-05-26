module.exports = (grunt) ->
    all:
        options:
            ignore:  [
                'The “details” element is not supported properly by browsers yet. It would probably be better to wait for implementations.'
                'Section lacks heading. Consider using “h2”-“h6” elements to add identifying headings to all sections.' # not a error, recommendation
                'Bad value “menuitem” for attribute “role” on element “a”.'
            ]
        src: [
            'build/*.html'
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