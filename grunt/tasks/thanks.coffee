module.exports = (grunt)->

    fs = require("fs")

    grunt.registerTask(
        'thanks'
        'INTERNAL: Joke. Shawnfies grunt.'
        ->
            done = @async()
            fileName = './node_modules/grunt/lib/grunt/fail.js'

            fs.readFile fileName,
                encoding: 'utf8'
            , (err, data) ->
                if err
                    console.log 'Error loading file', fileName, err
                    done()
                else
                    data = data.replace 'Done, without errors.', 'Done, thanks!'
                    fs.writeFileSync fileName, data
                    done()
    )