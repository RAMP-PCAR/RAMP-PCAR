module.exports = 
    main:
        options:
            requireCurlyBraces: [
                "if"
                "else"
                "for"
                "while"
                "do"
                "try"
                "catch"
            ]
            requireSpaceAfterKeywords: [
                "if"
                "else"
                "for"
                "while"
                "do"
                "switch"
                "return"
                "try"
                "catch"
            ]
            requireSpaceBeforeBlockStatements: true
            requireParenthesesAroundIIFE: true #JSHint: immed
            requireSpacesInFunctionExpression:
                beforeOpeningCurlyBrace: true

            requireSpacesInAnonymousFunctionExpression:
                beforeOpeningRoundBrace: true
                beforeOpeningCurlyBrace: true

            requireSpacesInNamedFunctionExpression:
                beforeOpeningCurlyBrace: true

            requireSpacesInFunctionDeclaration:
                beforeOpeningCurlyBrace: true

            requireMultipleVarDecl: true
            requireBlocksOnNewline: 1
            disallowEmptyBlocks: true
            disallowSpacesInsideArrayBrackets: true
            disallowSpacesInsideParentheses: true
            disallowQuotedKeysInObjects: true
            disallowSpaceAfterObjectKeys: true
            requireCommaBeforeLineBreak: true
            requireSpaceAfterPrefixUnaryOperators: [
                "+"
                "~"
            ]
            disallowSpaceAfterPrefixUnaryOperators: [
                "++"
                "--"
                "-"
                "!"
            ]
            disallowSpaceBeforePostfixUnaryOperators: [
                "++"
                "--"
            ]
            requireSpaceBeforeBinaryOperators: [
                "+"
                "-"
                "/"
                "*"
                "="
                "=="
                "==="
                "!="
                "!=="
            ]
            requireSpaceAfterBinaryOperators: [
                "+"
                "-"
                "/"
                "*"
                "="
                "=="
                "==="
                "!="
                "!=="
            ]
            disallowSpaceBeforeBinaryOperators: [","]
            disallowImplicitTypeConversion: [
                "numeric"
                "boolean"
                "binary"
                "string"
            ]
            requireSpacesInConditionalExpression:
                afterTest: true
                beforeConsequent: true
                afterConsequent: true
                beforeAlternate: true

            
            #requireCamelCaseOrUpperCaseIdentifiers: true,
            disallowTrailingComma: true
            disallowKeywords: ["with"]
            disallowMultipleLineStrings: true
            disallowMultipleLineBreaks: true
            disallowMixedSpacesAndTabs: true # spaces???
            disallowKeywordsOnNewLine: ["else"]
            requireCapitalizedConstructors: true
            safeContextKeyword: ["that", 'vm']
            requireDotNotation: true
            disallowYodaConditions: true
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