module.exports = 
    main:
        options:
                "esnext": true,
                "disallowSpacesInNamedFunctionExpression": {
                    "beforeOpeningRoundBrace": true
                },
                "disallowSpacesInFunctionDeclaration": {
                    "beforeOpeningRoundBrace": true
                },
                "requireSpacesInFunctionExpression": {
                    "beforeOpeningCurlyBrace": true
                },
                "requireSpacesInAnonymousFunctionExpression": {
                    "beforeOpeningRoundBrace": true
                    "beforeOpeningCurlyBrace": true
                },
                "requireSpacesInNamedFunctionExpression": {
                    "beforeOpeningCurlyBrace": true
                },
                "requireSpacesInFunctionDeclaration": {
                    "beforeOpeningCurlyBrace": true
                },
                "disallowEmptyBlocks": true,
                "disallowSpacesInCallExpression": true,
                "disallowSpacesInsideArrayBrackets": true,
                "disallowSpacesInsideParentheses": true,
                "disallowQuotedKeysInObjects": true,
                "disallowSpaceAfterObjectKeys": true,
                "disallowSpaceAfterPrefixUnaryOperators": true,
                "disallowSpaceBeforePostfixUnaryOperators": true,
                "disallowSpaceBeforeBinaryOperators": [
                    ","
                ],
                "disallowMixedSpacesAndTabs": true,
                "disallowTrailingWhitespace": true,
                "requireTrailingComma": { "ignoreSingleLine": true },
                "disallowYodaConditions": true,
                "disallowKeywords": [ "with" ],
                "disallowKeywordsOnNewLine": ["else"],
                "disallowMultipleLineBreaks": true,
                "disallowMultipleLineStrings": true,
                "disallowMultipleVarDecl": true,
                "requireSpaceBeforeBlockStatements": true,
                "requireParenthesesAroundIIFE": true,
                "requireSpacesInConditionalExpression": true,
                "requireBlocksOnNewline": 1,
                "requireCommaBeforeLineBreak": true,
                "requireSpaceBeforeBinaryOperators": true,
                "requireSpaceAfterBinaryOperators": true,
                "requireCamelCaseOrUpperCaseIdentifiers": true,
                "requireLineFeedAtFileEnd": true,
                "requireCapitalizedConstructors": true,
                "requireDotNotation": true,
                "requireSpacesInForStatement": true,
                "requireSpaceBetweenArguments": true,
                "requireCurlyBraces": [
                    "do"
                ],
                "requireSpaceAfterKeywords": [
                    "if",
                    "else",
                    "for",
                    "while",
                    "do",
                    "switch",
                    "case",
                    "return",
                    "try",
                    "catch",
                    "typeof"
                ],
                "requirePaddingNewLinesBeforeLineComments": {
                    "allExcept": "firstAfterCurly"
                },
                "requirePaddingNewLinesAfterBlocks": true,
                "requireSemicolons": true,
                "safeContextKeyword": "_this",
                "validateQuoteMarks": "'",
                "validateIndentation": 4

                validateJSDoc:
                    checkParamNames: true
                    checkRedundantParams: true
                    requireParamTypes: true

        files:
            src: [
                'src/js/RAMP/**/*.js'
                'src/js/plugins/**/*.js'
                '!src/js/lib/**/*.js'
            ]