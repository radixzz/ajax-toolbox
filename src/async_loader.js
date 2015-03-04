/**
 * Created by Iván Juárez on 01/03/2015.
 */
var asyncLoader = (function(doc){
  "use strict";
  var _appendTarget = doc.getElementsByTagName("head")[0] || doc.documentElement,
      _totalProgress = 0,
      _totalBytes = 0,
      _downloadedBytes = 0,
      _processedRequests = 0,
      _onProgressCallback,
      _completedResources = [],
      _injectedResources = 0,
      _manifest = [];

  function onDownloadProgress(event, resource) {
    _downloadedBytes += event.loaded - resource.downloadedBytes;
    resource.downloadedBytes = event.loaded;
    if (_processedRequests == _manifest.length) {
      _totalProgress = _downloadedBytes / _totalBytes;
      if (typeof _onProgressCallback == 'function') {
        _onProgressCallback({
          progress: getCurrentProgress(),
          resource: resource
        });
      }
    }
  }

  function getCurrentProgress(){
    return _totalProgress * 100;
  }

  function onDownloadComplete(event, resource) {
    resource.responseText = event.responseText;
    _completedResources.push(resource);
    updateResourceDependencies();
  }

  function isResourceDependenciesMet(resource) {
    var pendingDependencies = resource.requires.length;
    for(var i = 0; i < _completedResources.length; i++) {
      var isInjected = _completedResources[i].injected;
      var isCompleted = resource.requires.indexOf(_completedResources[i].id) > -1;
      if (isCompleted && isInjected){
        pendingDependencies--;
      }
    }
    return pendingDependencies == 0;
  }

  function updateResourceDependencies() {
    for (var i = 0; i < _completedResources.length; i++) {
      var resource = _completedResources[i];
      if (! resource.resolved) {
        var canBeResolved = resource.requires && isResourceDependenciesMet(resource) || !resource.requires;
        if (canBeResolved) {
          resolveResource(resource);
        }
      }
    }
  }

  function onResourceLoaded(resource) {
    console.log('Resource ready to use:', resource.src, _manifest.length);
    resource.injected = true;
    _injectedResources++;
    if (_injectedResources === _manifest.length) {
      console.log('Finished!', THREE);
    } else {
      updateResourceDependencies();
    }
  }

  function resolveResource(resource) {
    resource.resolved = true;
    injectDOMScript(resource);
  }

  function injectDOMScript(resource) {
    var script = doc.createElement('script');
    _appendTarget.insertBefore(script, _appendTarget.lastChild);
    var onLoad = function(event) {
      console.log('event', event);
      onResourceLoaded(resource);
    };

    if (resource.isXHR) {
      script.text = resource.responseText;
      script.async = false;
      onLoad();
    } else {
      _appendTarget.insertBefore(script, _appendTarget.lastChild);
      script.onload = onLoad;
      script.onreadystatechange = function() {
        if (script.readyState == "loaded" || script.readyState == "complete") {
          script.onload = script.onreadystatechange = null;
          onLoad();
        }
      };
      script.src = resource.src;
    }
  }

  function download(resource) {
    var request = new XMLHttpRequest();
    resource.isXHR = request.onprogress === null;
    if (resource.isXHR) {
      request.onprogress = function (event) {
        onDownloadProgress(event, resource);
      };

      request.onreadystatechange = function () {
        if (request.readyState == 2 && request.status == 200) {
          resource.totalBytes = parseInt(request.getResponseHeader('Content-Length'));
          _totalBytes += resource.totalBytes;
          _processedRequests++;
        } else if (request.readyState == 4 && request.status == 200) {
          request.onreadystatechange = null;
          onDownloadComplete(request, resource);
        }
      };
      request.open('GET', resource.src, true);
      request.send();
    } else {
      injectDOMScript(resource);
    }
  }

  function loadManifest( manifest ) {
    _manifest =  manifest instanceof Array ? manifest : [manifest];
    for (var i = 0; i < _manifest.length; i++) {
      var resource = _manifest[i];
      resource.isValid = resource.src != undefined && resource.id != undefined;
      if (resource.isValid) {
        resource.totalBytes = 0;
        resource.downloadedBytes = 0;
        resource.resolved = false;
        resource.injected = false;
      } else {
        console.warn('Invalid resource entry (no "id" or "src" specified): ', resource);
      }
    }
  }

  function start(onProgressCallback) {
    _onProgressCallback = onProgressCallback;
    _injectedResources = 0;
    _processedRequests = 0;
    _totalBytes = 0;
    for (var i = 0; i < _manifest.length; i++) {
      if (_manifest[i].isValid)
      download(_manifest[i]);
    }
  }

  return {
    'VERSION': '0.1',
    start: start,
    loadManifest: loadManifest,
    currentProgress: getCurrentProgress
  }
})(this.document);
