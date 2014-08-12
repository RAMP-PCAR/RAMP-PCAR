console.log('loading tempParse');
RAMP.plugins.featureInfoParser.tempParse = function (data) {
    var val = data.match( /value=(.*)\n/ ),
        unit = data.match( /unit=(.*)\n/ );
    val = val ? val[1] : '';
    unit = unit ? unit[1] : '';
    return "<p>{0}{1}</p>".format(val,unit);
}
