module.exports = 
    options:
        issueLink : (issueId) ->
            return '['+ issueId + '](http://tfs.int.ec.gc.ca:8080/tfs/DC/RAMP/_workitems/edit/' + issueId + ')'