module.exports = (grunt, options)->
    
    # core pkg always contains package data from RAMP core
    # in case of a RAMP theme, it additionally contains a path to the RAMP core dependency 

    corepath = 'lib/ramp-pcar/'
    corepackagepath = corepath + 'package.json'

    wetcorepath = 'lib/wet-boew/'
    
    pkg =        
        yuiconfig: {}
        core:
            path: null
            wet: null

        theme:
            path: null
            wet: null

        nfp: {}

    if grunt.file.exists corepackagepath
        pkg.isTheme = true
        
        pkg.core = grunt.file.readJSON(corepackagepath)

        pkg.core.path = corepath
        pkg.core.wet = wetcorepath

        pkg.theme = grunt.file.readJSON('package.json')
        pkg.theme.path = ''
        pkg.theme.wet = pkg.theme.ramp.themepath

        pkg.name = pkg.theme.name
        pkg.version = pkg.theme.version
        pkg.description = pkg.theme.description
        
        # store serve ports
        pkg.serve = pkg.theme.ramp.serve
    else
        pkg.isTheme = false
        
        pkg.core = grunt.file.readJSON('package.json')

        pkg.core.path = ''
        pkg.core.wet = wetcorepath

        pkg.theme.path =  '_/'
        pkg.theme.wet = '_/'

        pkg.name = pkg.core.name
        pkg.version = pkg.core.version
        pkg.description = pkg.core.description

        # store serve ports
        pkg.serve = pkg.core.ramp.serve

    # derive the series number
    pkg.series = 'v' + pkg.core.version.split('.').slice(0,2).join('.')# + '-dist'

    # store deploy folder reference
    pkg.deployFolder = pkg.core.ramp.deployFolder


    # not for production warning corner ribbon css
    pkg.nfp.head = '<!-- R-NFP:S -->
        <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/github-fork-ribbon-css/0.1.1/gh-fork-ribbon.min.css" />
        <!--[if lt IE 9]>
          <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/github-fork-ribbon-css/0.1.1/gh-fork-ribbon.ie.min.css" />
        <![endif]--><!-- R-NFP:E -->'
    # not for production warning corner ribbon html
    pkg.nfp.body = '<!-- R-NFP:S -->
        <div class="github-fork-ribbon-wrapper left">
            <div class="github-fork-ribbon" style="top: 34px; left: -50px">
                <a href="" style="width: 210px; line-height: 27px">
                    <span style="
                        top: -6px;
                        position: relative;
                    ">Not for Production</span><br> <span style="
                        top: 11px;
                        position: absolute;
                        left: 39%;
                        font-size: smaller;
                        font-weight: normal;
                    ">v' + pkg.core.version + '</span>
                </a>
            </div>
        </div><!-- R-NFP:E -->'

    # read a yui config file from the core
    yuiconfigpath = pkg.core.path + 'yuidoc.json'
    if grunt.file.exists yuiconfigpath
        pkg.yuiconfig = grunt.file.readJSON(yuiconfigpath)

    # store package as grunt option
    grunt.option 'pkg', pkg

    return pkg




