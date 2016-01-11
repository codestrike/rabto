// UI handeling
Rabto.ui.sendSMS = function(e) {
	var renter = e.getAttribute('data-id');
	var text = e.getAttribute('data-message');
	mixpanel.track('send sms', {'renter':renter});
	Rabto.db.sendSMS(renter, text);
	console.log('[ui.sendSMS]', renter);
};

Rabto.ui.shareWhatsApp = function(e) {
	mixpanel.track('share whatsapp');
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
					<a href="whatsapp://send?text=Hi ${product.name}, I want ${product.title}" onclick="Rabto.ui.shareWhatsApp(this);">
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

Rabto.ui.initSearchEvents = function() {
	Rabto.ui.modalFile.addEventListener('change', function(e) {
		var selectedImage = Rabto.ui.modalFile.files[0]; 
		fileReader = new FileReader();
		if(selectedImage.name.length > 0){
			fileReader.onload = function(fileLoadEvent) {
				Rabto.ui.imageData = fileLoadEvent.target.result;
				console.log("[CLient on File Change]", Rabto.ui.imageData);
			}

		}
	});

	Rabto.ui.searchBar.addEventListener('submit', function(e) {
		e.preventDefault();
		Rabto.db.search(
			Rabto.ui.searchQuery.value,
			function(results, err) {
				if (err) {
					console.log('[submit ui.searchBar]', err);
					return;
				}

				if (results) {
					mixpanel.track("search found");
				} else {
					mixpanel.track("search not found", {'query':Rabto.ui.searchQuery})
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
		var replacedImageData = Rabto.ui.imageData.replace(/\//g,'$OYO$');
		if (!title || !description || !replacedImageData) return;
		mixpanel.track('add item');
		Rabto.db.addItem(title, description, replacedImageData, function(e) {
			window.location = window.location.origin + '/#';
		}, true);
	});
};

Rabto.ui.initSearch = function() {
	Rabto.ui.searchBar = document.getElementById('search-bar');
	Rabto.ui.searchQuery = document.getElementById('search-input');
	Rabto.ui.productList = document.getElementById('product-list');
	Rabto.ui.fab = document.getElementById('fab-btn');
	Rabto.ui.modalSubmit = document.getElementById('modal-submit');
	Rabto.ui.modalCancel = document.getElementById('modal-cancel');
	Rabto.ui.modalTitle = document.getElementById('modal-title');
	Rabto.ui.modalDescription = document.getElementById('modal-description');
	Rabto.ui.modalFile = document.getElementById('modal-file');
	Rabto.ui.imageData = null;
	Rabto.ui.initSearchEvents();
};

// DB handeling
Rabto.db.sendSMS = function(renter, text) {
	Rabto.db.get(window.location.origin + '/api/send/sms/' + encodeURI(renter) + '/' + encodeURI(text));
}

Rabto.db.search = function(query, callback, noJSON) {
	Rabto.db.get(window.location.origin + '/api/q/' + encodeURI(query), callback, noJSON);
};

Rabto.db.addItem = function(title, description, replacedImageData, callback, noJSON) {
	var url = window.location.origin + '/api/add/item/' + encodeURI(title) + '/' + encodeURI(description) + '/' + encodeURI(replacedImageData);
	Rabto.db.get(url, callback, noJSON);
	console.log("[CLient add itemurl]",url)
};
