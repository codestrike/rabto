var Rabto = {
	ui: {}, // UI interaction
	db: {} // Database
};

Rabto.ui.sendSMS = function(e) {
	var renter = e.getAttribute('data-id');
	var text = e.getAttribute('data-message');
	Rabto.db.sendSMS(renter, text);
	console.log('[ui.sendSMS]', renter);
};

Rabto.ui.renderResults = function(results) {
	Rabto.ui.productList.innerHTML = '';
	if (results) {
		results.forEach(function(product) {
			var card = document.createElement('div');
			card.className = 'product-card';
			card.innerHTML = `<div>
				<div class="product-image"></div>
			</div>
			<div class="product-content">
				<div class="product-title">${product.title}</div>
				<div class="product-description">${product.description}</div>
				<div class="product-renter">
					<a href="whatsapp://send?text=Hi ${product.name}, I want ${product.title}">
						<i class="fa fa-lg fa-whatsapp"></i>
					</a> &emsp;
					<span href="#" class="send-sms" data-id="${product.id}" data-message="Hi ${product.name}, I want ${product.title}" onclick="Rabto.ui.sendSMS(this);">
						<i class="fa fa-lg fa-envelope-o"></i>
					</span> &emsp;
					${product.name}
				</div>
			</div>`;
			Rabto.ui.productList.appendChild(card);
		});
	}
};

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
	});

	Rabto.ui.fab.addEventListener('click', function(e) {
		window.location = window.location.origin + '/#openModal';
	});

	Rabto.ui.modalCancel.addEventListener('click', function(e) {
		window.location = window.location.origin + '/#';
	});

	Rabto.ui.modalSubmit.addEventListener('click', function(e) {
		var title = Rabto.ui.modalTitle.value;
		var description = Rabto.ui.modalDescription.value;
		if (!title && !description) return;

		Rabto.db.addItem(title, description, function(e) {
			window.location = window.location.origin + '/#';
		}, true);
	});
};

Rabto.ui.init = function() {
	Rabto.ui.searchBar = document.getElementById('search-bar');
	Rabto.ui.searchQuery = document.getElementById('search-input');
	Rabto.ui.productList = document.getElementById('product-list');
	Rabto.ui.fab = document.getElementById('fab-btn');
	Rabto.ui.modalSubmit = document.getElementById('modal-submit');
	Rabto.ui.modalCancel = document.getElementById('modal-cancel');
	Rabto.ui.modalTitle = document.getElementById('modal-title');
	Rabto.ui.modalDescription = document.getElementById('modal-description');

	Rabto.ui.initEvents();
};

// Rabto.db starts
Rabto.db.get = function(url, callback, noJSON) {
	var xhr = new XMLHttpRequest();
	xhr.open('get', url, true);
	xhr.send();

	xhr.onreadystatechange = function() {
		if (typeof callback === 'function') {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var data = xhr.responseText;
				if (!noJSON)
					data = JSON.parse(data);

				callback(data);
			} else if (xhr.readyState == 4 && xhr.status != 200) {
				callback(null, xhr.status);
			}
		}
	}
};

Rabto.db.sendSMS = function(renter, text) {
	Rabto.db.get(window.location.origin + '/api/send/sms/' + encodeURI(renter) + '/' + encodeURI(text));
}

Rabto.db.search = function(query, callback, noJSON) {
	Rabto.db.get(window.location.origin + '/api/q/' + encodeURI(query), callback, noJSON);
};

Rabto.db.addItem = function(title, description, callback, noJSON) {
	Rabto.db.get(window.location.origin + '/api/add/item/' + encodeURI(title) + '/' + encodeURI(description), callback, noJSON);
};

Rabto.db.init = function() {}

// Fire In The Hole!
Rabto.db.init();
Rabto.ui.init();
