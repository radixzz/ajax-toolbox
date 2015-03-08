# Page Blender
Enables simple navigation between pages without reloading the page. It assumes no extra features of content gathering such as json's so this method is SEO friendly.

Initialization requires a function for onPageChange event and the HTMLElement in wich you want the content to change.

```javascript
AjaxToolbox.pageBlender.initialize({
	onPageChange: functionCallback,
	containerElement: HTMLElement
});
```

onPageChange event is executed when the page content is about to be inserted into the DOM, here you can do all the logic of hidding and showing the new content.

Initialization example:

```javascript
AjaxToolbox.pageBlender.initialize({
	onPageChange: function(event){
		event.currentNode.style.display = 'none';
		event.targetNode.style.display = 'block';
	},
	containerElement: document.getElementById('xhr-container')
});
```

# Asset Loader
A dead simple async preloader for scripts.

Add a manifest with your libraries and describe their dependencies with the requires param (optional)
```javascript
ajaxToolbox.assetLoader.loadManifest([
  { id: 1, src: 'js/vendor/lib_one.js'  },
  { id: 2, src: 'js/vendor/lib_two.js', requires: [1] },
  { id: 3, src: 'js/vendor/lib_three.js'  },
  { id: 4, src: 'js/main.js', requires: [2,3] }
]);
```

Monitor the loader by adding a callback on start function:
```javascript
ajaxToolbox.assetLoader.start( function(event) {
  console.log('Progress:', event.progress);
});
```
