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


    mergeLocale = (o1, o2, prefix, extend) ->
        # `extend`: if true, o2 will be extended with o1; the result might not be sorted
        # Properties from the Souce1 object will be copied to Source2 Object.
        # prefix will be added to the missing properties

        mj = if extend then o2 else {}

        # get the keys
        ps = Object.keys(o1).sort()

        for p in ps
            if o2.hasOwnProperty(p)
                if o1[p] != null and typeof o1[p] == 'object'
                # Recursive call if the property is an object,
                # Iterate the object and set all properties of the inner object.
            
                    mj[p] = mergeLocale o1[p], o2[p], prefix, extend
                else
                    mj[p] = o2[p]
            else
                if typeof o1[p] == 'object'
                    mj[p] = mergeLocale o1[p], {}, prefix, extend
                #else copy the property from source1
                else 
                    mj[p] = prefix + o1[p]
        mj

    sortLocale = (lang) ->
        localeData = grunt.file.readJSON 'src/locales/' + lang + '-CA/translation.json'
        sorted = mergeLocale localeData, {}, ''
        grunt.file.write 'src/locales/' + lang + '-CA/translation.json', JSON.stringify(sorted, null, '    ')

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
                            
                            # saving merged locale
                            grunt.file.write 'src/locales/' + lang + '-CA/translation.json', JSON.stringify(merged, null, '    ')
            )
    )

    grunt.registerTask(
        'locale:merge'
        'INTERNAL Merge theme locale files is any.'
        () ->
            # use different path depending on what is building
            corepkg = grunt.option 'corepkg'
            isTheme = corepkg.isTheme

            if isTheme

                languages = corepkg.ramp.locale.languages
                tasks = []

                coreLocale = {}
                themeLocale = {}
                mergedLocale = {}
                
                # iterate over available languages and merge theme and core locale files
                languages.forEach(
                    (lang) ->
                        coreLocale = grunt.file.readJSON 'build/locales/' + lang + '-CA/translation.json'
                        themeLocale = grunt.file.readJSON 'src/locales/' + lang + '-CA/translation.json'
                        mergedLocale = mergeLocale coreLocale, themeLocale, '', true
                        
                        grunt.file.write 'build/locales/' + lang + '-CA/translation.json', JSON.stringify(mergedLocale, null, '    ')
                )
                
                # lint merged files
                tasks.push 'jsonlint:mergedLocales'
                
                grunt.task.run tasks
    )