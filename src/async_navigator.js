var AsyncToolbox = AsyncToolbox || {};

AsyncToolbox.navigator = AsyncToolbox.navigator || (function(window, document) {
	"use strict";
	var _isSupported = !!(window.history && history.pushState),
		_resolverElement = document.createElement('a'),
		_history = window.history,
		_linkClass,
		_pages = [],
		_contentClass,
		_containerElement,
		_baseHost;

	function onStateChanged() {

	}

	function pushUrlState(url, title) {
		if (isBaseUrl(url)) {
			document.title = title;
			_history.pushState({}, title, url);
		}
	}

	function getUrlContent( url, callback ) {
		if (isBaseUrl(url)) {
			console.log('Processing:', url);
			var xhr = new XMLHttpRequest();
			xhr.onload = function(event) {
				console.log('onLoad!',event);
				callback(event.target.responseText);
			};
			xhr.open('GET', url);
			xhr.send();
		} else {
			console.error('XDR Contents are not allowed.');
		}
	}

	function getCachedPage(url) {
		var hash = getHashFromUrl(url);
		return _pages[hash];
	}

	function injectContent(targetElement, payloadElement) {
		if (payloadElement) {
			var elementId = payloadElement.getAttribute('id');
			var idExists = !!document.getElementById(elementId);
			if (! idExists) {
				targetElement.insertBefore(payloadElement);
				console.log(idExists, targetElement);
			}
		}
	}

	function getHashFromUrl(url) {
		var numHash = url.split("").reduce(function(a, b) { 
			a = ((a << 5) - a) + b.charCodeAt(0);
        	return a & a;
      	}, 0);
      	// Convert numeric hash to text
      	return ("00000" + (numHash * Math.pow(36,5) << 0).toString(36)).slice(-5);
	}

	function getPage(url, callback) {
		
		getUrlContent(url, function(textContent) {
			var el = document.createElement('div');
			el.innerHTML = textContent;
			var payloadElement = el.getElementsByClassName(_contentClass)[0];
			var titleNode = el.getElementsByTagName('title');
			var title = titleNode[0] ? titleNode[0].text : url;
			console.log('GetPage', url);
			
			if (! payloadElement) {
				console.error('Couldn\'t find any element with class:',
				_contentClass, 'on target:', url);
			}

			var page = {
				payloadElement: payloadElement,
				textContent: textContent,
				title: title
			};

			callback(page);

			var pageHash = getHashFromUrl(url);
			_pages[pageHash] = page;
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
		var aElement = event.target;
		event.preventDefault();
		var href = getNormalizedUrl(aElement.href);
		getPage(href, function(pageDescriptor) {
			pushUrlState(href);
			injectContent(_containerElement,
				pageDescriptor.payloadElement);
		});
	}

	function addLinkEvents() {
		var documentLinks = document.links;
		for (var i = 0; i < documentLinks.length; i++ ) {
			var link = documentLinks[i];
			if (_linkClass == link.getAttribute('class')) {
				link.onclick = onLinkClick;
			}
		}
	}

	function initialize(params) {
		// already initialized?
		if (!!_containerElement) return;

		params = params || {};
		_linkClass = params.linkClass || 'xhr-link';
		_contentClass = params.contentClass || 'xhr-content';
		_containerElement = params.containerElement;
		_baseHost = document.location.host;

		if (_isSupported && _containerElement) {
			addLinkEvents();
		}
	}

	return {
		initialize: initialize
	};

})(window, document);

AsyncToolbox.navigator.initialize({
	onBeforeDOMInject: function(){
		console.log('onBeforeDOMInject');
	},
	onLoadStart: function() {
		console.log('onLoadStart');
	},
	onLoadCompleted: function() {
		console.log('onLoadCompleted');
	},
	onLoadProgress: function(progress) {
		console.log('progress:', progress);
	},
	containerElement: document.getElementById('xhr-container')
});