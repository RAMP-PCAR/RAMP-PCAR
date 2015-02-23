xhook.before(function(request, callback) {
  //skip browsers that dont use XDR
  if(!window.XDomainRequest)
    return callback();
  //skip requests that aren't cross domain
  var url = request.url;
  var loc = window.location;
  var hostname = loc.hostname + (loc.port ? ":"+loc.port : "");
  if(!/^https?:\/\/([^\?\/]+)/.test(url) || RegExp.$1 === hostname)
    return callback();

  //if not GET, force POST
  var method = request.method;
  if(method !== 'GET') method = 'POST';
  //force same protocol
  url = url.replace(/^https?:/,loc.protocol);
  //request!
  var xdr = new window.XDomainRequest();
  xdr.timeout = request.timeout;
  //proxy events
  var proxy = function(e) {
    xdr['on'+e] = function() {
      request.xhr.dispatchEvent(e);
    };
  };
  var events = ['progress','timeout','error'];
  for(var i = 0; i < events.length; ++i )
    proxy(events[i]);
  //custom onload
  xdr.onload = function() {
    callback({
      status: 200,
      statusText: "OK",
      headers: {
        'Content-Type': xdr.contentType
      },
      text: xdr.responseText
    })
  };
  xdr.open(method, url);
  xdr.send(request.body);
  return
});
