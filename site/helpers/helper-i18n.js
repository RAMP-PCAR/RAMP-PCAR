module.exports.register = function(Handlebars, options) {

    var i18n = require('i18next'),
        file = require('fs-utils'),
        languages = options.i18next.languages,
        debug = options.i18next.debug,
        countryCode = options.i18next.countryCode,
        localePath = options.i18next.localePath,
        resStore = {};

    languages.forEach(function(lang) {
        resStore[lang + '-' + countryCode] = {
            translation: file.readDataSync(localePath + '/' + lang + "-" + countryCode + '/translation.json')
        }
    });

    i18n.init({
        resStore: resStore,
        fallbackLng: false,
        debug: debug
    });

    Handlebars.registerHelper('t', function(i18n_key) {
        var result;

        i18n.setLng(this.language + '-' + countryCode);
        result = i18n.t(i18n_key);
        //console.log(i18n_key, result, this.language);
        return new Handlebars.SafeString(result);
    });
};