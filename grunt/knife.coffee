module.exports = 

    # expands the arr of file names with the cwd base path, appends whatever is in extra
    smartExpand: ( cwd, arr, extra ) ->    
        # determine file order here and concat to arr
        extra = extra or []
        arr.map(( file ) ->
            cwd + file
        ).concat extra