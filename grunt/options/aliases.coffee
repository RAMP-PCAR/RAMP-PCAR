module.exports = 
    # 'INTERNAL: Copies files (except JS and CSS) needed for a build.'
    'copy:build': 
        [
            'generateConfig'
            'copy:polyfillBuild'
            'copy:wetboewBuild'
            'copy:assetsBuild'
            'copy:proxyBuild'
            'copy:localesBuild'
            'copy:templatesBuild'
            'notify:assets'
        ]

    #'INTERNAL: Copies files (except JS and CSS) needed for a distribution package.'
    'copy:dist': 
        [
            'copy:polyfillDist'
            'copy:wetboewDist'
            'copy:assetsDist'
            'copy:configDist'
            'copy:proxyDist'
            'copy:localesDist'
            'copy:cssLibResDist'
            'copy:templatesDist'
        ]