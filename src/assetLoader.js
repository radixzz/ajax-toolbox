/**
 * Created by Iván Juárez on 01/03/2015.
 */
var ajaxToolbox = ajaxToolbox || {};

ajaxToolbox.assetLoader = ajaxToolbox.assetLoader || (function(doc){
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
          progress: _totalProgress,
          resource: resource
        });
      }
    }
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
    console.log('Resource ready to use:', resource.src);
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
    script.text = resource.responseText;
    script.async = false;
    onResourceLoaded(resource);
  }

  function download(resource) {
    var request = new XMLHttpRequest();
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
      if (_manifest[i].isValid) download(_manifest[i]);
    }
  }

  return {
    'VERSION': '0.1',
    start: start,
    loadManifest: loadManifest
  }
})(this.document);
