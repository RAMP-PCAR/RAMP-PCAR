module.exports = (grunt) -> 
    
    ## check if two json files have the same structure; only compares property names; doesn't not compare property contents
    deepCheck = (o1, o2) ->
        k1 = Object.keys(o1).sort()
        k2 = Object.keys(o2).sort()

        if k1.length != k2.length
            return false
        
        for key in k1
            if o1.hasOwnProperty(key) != o2.hasOwnProperty(key)
                return false
            else if typeof o1[key] != typeof o2[key]
                return false
            
            if typeof o1[key] == 'object'
                if not deepCheck(o1[key], o2[key])
                    return false
        return true 
        # o1[key] === o2[key] # use this for value comparison

    mergeLocale = (o1, o2, prefix) ->
        # Properties from the Souce1 object will be copied to Source2 Object.
        # prefix will be added to the missing properties

        mj = {}        

        # get the keys
        ps = Object.keys(o1).sort()

        for p in ps
            if o2.hasOwnProperty(p)
                if o1[p] != null and typeof o1[p] == 'object'
                # Recursive call if the property is an object,
                # Iterate the object and set all properties of the inner object.
            
                    mj[p] = mergeLocale o1[p], o2[p], prefix
                else
                    mj[p] = o2[p]
            else
                if typeof o1[p] == 'object'
                    mj[p] = mergeLocale o1[p], {}, prefix
                #else copy the property from source1
                else 
                    mj[p] = prefix + o1[p]
        mj

    sortLocale = (lang) ->
        localeData = grunt.file.readJSON 'src/locales/' + lang + '-CA/translation.json'
        sorted = mergeLocale localeData, {}, ''

        # check if the original and sorted locales differ
        localeStringified = JSON.stringify(localeData, null, '    ')
        sortedStringified = JSON.stringify(sorted, null, '    ')

        # saving merged locale if it differes
        if localeStringified != sortedStringified
            console.log lang, 'locale is sorted; saving'
            grunt.file.write 'src/locales/' + lang + '-CA/translation.json', sortedStringified

    grunt.registerTask(
        'locale:check'
        'INTERNAL Checks locale files for completeness.'
        () ->
            main = grunt.config("pkg.ramp.locale.main")
            languages = grunt.config("pkg.ramp.locale.languages")
            localeData = {}
            isValid = false
            
            # sort default locale file
            sortLocale main

            # read main lang
            localeData[main] = grunt.file.readJSON 'src/locales/' + main + '-CA/translation.json'

            languages.forEach(
                (lang) ->
                    if lang != main
                        localeData[lang] = grunt.file.readJSON 'src/locales/' + lang + '-CA/translation.json'

                        isValid = deepCheck localeData[main], localeData[lang]

                        if isValid
                            grunt.task.run 'notify:localeValid'
                        else
                            grunt.task.run 'notify:localeInvalid'
                            
                            # assuming French locale is missing string; merge in English ones with a prefix
                            merged = mergeLocale localeData[main], localeData[lang], '[' + lang + '] '
                            # console.log merged
                            
                            # check if the original and merged locales differ
                            localeStringified = JSON.stringify(localeData[lang], null, '    ')
                            mergedStringified = JSON.stringify(merged, null, '    ')

                            # saving merged locale if it differes
                            if localeStringified != mergedStringified
                                console.log lang, 'locale is merged; saving'
                                grunt.file.write 'src/locales/' + lang + '-CA/translation.json', JSON.stringify(merged, null, '    ')
            )
    )