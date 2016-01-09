var Rabto = {
	ui: {}, // UI interaction
	db: {} // Database
};

Rabto.ui.init = function() {
	Rabto.ui.searchBar = document.getElementById('search-bar');
	Rabto.ui.searchQuery = Rabto.ui.searchBar.getElementsByTagName('input')[0];
	Rabto.ui.productList = document.getElementById('product-list');

	Rabto.ui.initEvents();
};

Rabto.ui.renderResults = function(results) {
	if (results) {
		results.forEach(function(product) {
			var card = document.createElement('div');
			card.className = 'product-card';
			card.innerHTML = `<div>
				<div class="product-image"></div>
			</div>
			<div class="product-content">
				<div>${product.id}</div>
				<div class="product-description">This is basic decription ${product.renter}</div>
				<div>${product.name}</div>
			</div>`;
			Rabto.ui.productList.appendChild(card);
		});
	}
}

Rabto.ui.initEvents = function() {
	Rabto.ui.searchBar.addEventListener('submit', function(e) {
		e.preventDefault();
		Rabto.db.search(
			Rabto.ui.searchQuery.value,
			function(results, err) {
				if (err) {
					console.log('[submit ui.searchBar]', err);
					return;
				}

				Rabto.ui.renderResults(results);
			});
		console.log('[submit initEvents]');
	});
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
