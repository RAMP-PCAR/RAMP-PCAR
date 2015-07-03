module.exports = 
    files: [
        'src/js/RAMP/**/*.js'
        'src/js/plugins/**/*.js'
        '!src/js/lib/**/*.js'
    ]
    options:                
        # options here to override JSHint defaults
        # enforce
        bitwise: true
        camelcase: false #true, //(optional)
        curly: true
        eqeqeq: true
        es3: false
        forin: true
        freeze: true
        immed: true
        indent: false
        latedef: 'nofunc'
        newcap: true
        noarg: true
        noempty: false #(sometimes want "do nothing" functions)
        nonew: true
        plusplus: false
        quotmark: false
        undef: true
        unused: true #"strict",
        strict: true
        trailing: true
        
        # relax
        asi: false
        boss: false
        debug: false
        eqnull: true
        esnext: false
        evil: false
        
        #expr: false, (?)
        funcscope: false
        gcl: false
        globalstrict: false
        iterator: false
        lastsemic: false
        laxbreak: false
        laxcomma: false
        loopfunc: false
        maxerr: 50 # (default is good)
        moz: false
        multistr: false
        notypeof: false
        proto: false
        scripturl: false
        smarttabs: true
        shadow: false
        sub: false
        supernew: false
        validthis: false
        noyield: false