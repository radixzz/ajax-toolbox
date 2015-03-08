/**
 * Created by Iván Juárez on 01/07/2015.
 */

var AjaxToolbox = AjaxToolbox || {};

AjaxToolbox.pageBlender = AjaxToolbox.pageBlender || 
(function(wnd, doc) {
	"use strict";
	var _isSupported = !!(wnd.history && history.pushState),
		_resolverElement = doc.createElement('a'),
		_history = wnd.history,
		_location = doc.location,
		_cachedPages = [],
		_linkClass,
		_contentClass,
		_containerElement,
		_currentPage,
		_lastLocation,
		_baseHost,
		_onPageChange;

	function onStateChanged(event) {
		handleUrlChange(_location.href);
	}

	function pushUrlState(id, url, title) {
		if (isBaseUrl(url)) {
			_history.pushState({id: id}, title, url);
		}
	}

	function switchToPage(page) {
		if (page.urlHash != _currentPage.urlHash) {
			doc.title = page.title;
			if (typeof _onPageChange == 'function') {
				_onPageChange({
					currentNode: _currentPage.payloadNode,
					targetNode: page.payloadNode
				});
			}
			_currentPage = page;
			injectContent(_containerElement, page.payloadNode);
		}
	}

	function getXHRContent( url, callback ) {
		if (isBaseUrl(url)) {
			//console.log('Processing:', url);
			var xhr = new XMLHttpRequest();
			xhr.onload = function(event) {
				//console.log('onLoad!',event);
				callback(event.target.responseText);
			};
			xhr.open('GET', url);
			xhr.send();
		} else {
			console.error('XDR Contents are not allowed.');
		}
	}

	function getPageFromCache(url) {
		var hash = getHashFromString(url);
		//console.log('cached pages:', _cachedPages);
		return _cachedPages[hash];
	}

	function injectContent(targetElement, payloadNode) {
		if (targetElement && payloadNode) {
			var elementId = payloadNode.getAttribute('id');
			var idExists = !!doc.getElementById(elementId);
			if (! idExists) {
				targetElement.appendChild(payloadNode);
				//console.log(idExists, targetElement);
			}
		}
	}

	function getHashFromString(url) {
		var numHash = url.split("").reduce(function(a, b) { 
			a = ((a << 5) - a) + b.charCodeAt(0);
        	return a & a;
      	}, 0);
      	// Convert numeric hash to text
      	return ("00000" + (numHash * Math.pow(36,5) << 0)
      		.toString(36)).slice(-5);
	}

	function handleUrlChange( url, pushState ) {
		var url = getNormalizedUrl(url);
		if (url !== _lastLocation.href) {
			getPage(url, function(page) {
				_lastLocation = url;
				if (pushState) {
					pushUrlState(page.urlHash, url);
				}
				switchToPage(page);
			});
		}
	}

	function newPage(htmlText, url) {
		var el = doc.createElement('div');
		el.innerHTML = htmlText;
		var payloadNode = el.getElementsByClassName(_contentClass)[0];
		var payloadId = payloadNode && payloadNode.getAttribute('id');
		var titleNode = el.getElementsByTagName('title');
		var title = titleNode[0] ? titleNode[0].text : url;
		//if node is already on current document don't create a copy
		payloadNode = doc.getElementById(payloadId) || payloadNode;

		if (! payloadNode) {
			console.error('Couldn\'t find any element with class:',
			_contentClass, 'on target:', url);
		}

		var page = {
			payloadNode: payloadNode,
			textContent: htmlText,
			title: title,
			urlHash: getHashFromString(url)
		};

		addPageToCache(page);
		return page
	}

	function addPageToCache(page) {
		_cachedPages[page.urlHash] = page;
	}

	function getPage(url, callback) {
		var cachedPage = getPageFromCache(url);
		
		if (cachedPage) {
			callback(cachedPage);
			return;
		}

		getXHRContent(url, function(response) {
			var page = newPage(response, url);
			callback(page);
		});
	}

	function isBaseUrl(url) {
		_resolverElement.href = url;
		return _baseHost == _resolverElement.host;
	}

	function getNormalizedUrl(url) {
		_resolverElement.href = url;
		return _resolverElement.href;
	}

	function onLinkClick(event) {
		handleUrlChange(event.target.href, true);
		event.preventDefault();
	}

	function addLinkEvents() {
		var documentLinks = doc.links;
		for (var i = 0; i < documentLinks.length; i++ ) {
			var link = documentLinks[i];
			if (_linkClass == link.getAttribute('class')) {
				link.onclick = onLinkClick;
			}
		}
	}

	function initialize(params) {
		params = params || {};

		// already initialized?
		if (!!_containerElement) return;
		if (params.containerElement == undefined) {
			console.error('Initialization Error: missing container element.');
			return;
		}

		_onPageChange = params.onPageChange;
		_linkClass = params.linkClass || 'xhr-link';
		_contentClass = params.contentClass || 'xhr-content';
		_containerElement = params.containerElement;
		_baseHost = _location.host;
		_lastLocation = _location.href;
		_currentPage = newPage(doc.documentElement.innerHTML, _lastLocation);
		wnd.onpopstate = onStateChanged;

		if (_isSupported && _containerElement) {
			addLinkEvents();
		}
	}

	return {
		'VERSION': '0.1',
		initialize: initialize
	};

})(window, document);