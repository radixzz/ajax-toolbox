# Async-loader
A dead simple async preloader for scripts.

Add a manifest with your libraries and describe their dependencies with the requires param (optional)
```javascript
asyncLoader.loadManifest([
  { id: 1, src: 'js/vendor/lib_one.js'  },
  { id: 2, src: 'js/vendor/lib_two', requires: [1] },
  { id: 3, src: 'js/vendor/lib_three.js'  },
  { id: 4, src: 'js/main.js', requires: [2,3] }
]);
```

Monitor the loader by adding a callback on start function:
```javascript
asyncLoader.start( function(event) {
  console.log('Progress:', event.progress);
});
```
