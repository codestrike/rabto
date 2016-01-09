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

Rabto.db.init = function() {
	Rabto.db.search = function(query, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open('get', window.location.origin + '/api/q/' + encodeURI(query), true);
		xhr.send();

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				callback(results);
			} else if (xhr.readyState == 4 && xhr.status != 200) {
				callback(null, xhr.status);
			}
		}
	}
}

// Fire In The Hole!
Rabto.db.init();
Rabto.ui.init();
