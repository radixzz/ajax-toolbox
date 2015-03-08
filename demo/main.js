AjaxToolbox.pageBlender.initialize({
	onPageChange: function(event){
		event.currentNode.style.display = 'none';
		event.targetNode.style.display = 'block';
	},
	containerElement: document.getElementById('xhr-container')
});