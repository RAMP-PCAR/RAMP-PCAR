module.exports = (grunt)-> 
    
    if grunt.file.exists 'yuidoc.json'
        grunt.file.readJSON('yuidoc.json')