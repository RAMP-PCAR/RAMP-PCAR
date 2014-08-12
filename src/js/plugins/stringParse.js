console.log('loading stringParse');
RAMP.plugins.featureInfoParser.stringParse = function (data) {
    return "<p>{0}</p>".format(data);
}