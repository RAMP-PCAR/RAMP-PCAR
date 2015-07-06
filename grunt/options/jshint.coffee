module.exports = 
    files: [
        'src/js/RAMP/**/*.js'
        'src/js/plugins/**/*.js'
        '!src/js/lib/**/*.js'
    ]
    options:                
        "browser": true,
        "jquery": true,
        "node": true,
        "esnext": true,
        "camelcase": true,
        "eqeqeq": true,
        "indent": 4,
        "latedef": "nofunc",
        "maxlen": 120,
        "newcap": true,
        "quotmark": "single",
        "strict": true,
        "undef": true,
        "unused": true,
        "eqnull": true
