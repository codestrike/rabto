var Rabto = {
	ui: {}, // UI interaction
	db: {} // Database
};

Rabto.ui.init = function() {
	Rabto.ui.searchBar = document.getElementById('search-bar');

	Rabto.ui.initEvents();
};

Rabto.ui.initEvents = function() {
	Rabto.ui.searchBar.addEventListener('submit', function(e) {
		e.preventDefault();
		console.log('[submit initEvents]');
	})
}

// Fire In The Hole!
Rabto.ui.init();