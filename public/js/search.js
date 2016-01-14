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

Rabto.ui.getResizedUrl = function(url, height, width) {
		if(url){
            return url.replace(/upload\/\w+/i,`upload/w_${width},h_${height},c_fill`);
		}
 };

Rabto.ui.renderResults = function(results) {
	Rabto.ui.productList.innerHTML = '';
	if (results) {
		results.forEach(function(product) {
			var card = document.createElement('section');
			console.log(product);
			card.className = 'rabto-flex rabto-item mui--divider-top';
			card.innerHTML = `<div>
				<div class="rabto-thumb-circle" style="background-image:url('${Rabto.ui.getResizedUrl(product.image_url, 64, 64)}')" ></div>
			</div>
			<div class="product-content">
				<div class="mui--text-subhead">${product.title}</div>
				<div class="mui--text-body2">${product.description}</div>
				<div class="mui--text-subhead">
					${product.name}
					<a href="whatsapp://send?text=Hi ${product.name}, I want ${product.title}" class="mui-btn" onclick="Rabto.ui.shareWhatsApp(this);">
						<i class="fa fa-lg fa-whatsapp"></i> WhatsApp
					</a>
					<span href="#" class="mui-btn" data-id="${product.id}" data-message="Hi ${product.name}, I want ${product.title}" onclick="Rabto.ui.sendSMS(this);">
						<i class="fa fa-lg fa-envelope-o"></i> SMS
					</span> 
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
			fileReader.readAsDataURL(selectedImage);
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

	Rabto.ui.modalSubmit.addEventListener('click', function(e) {
		e.preventDefault();
		var title = Rabto.ui.modalTitle.value;
		var description = Rabto.ui.modalDescription.value;
		var replacedImageData = Rabto.ui.imageData;		
		if (!title || !description || !replacedImageData) return;
		mixpanel.track('add item');
		Rabto.ui.modalSubmit.disabled = true;
		Rabto.db.addItem(title, description, replacedImageData, function(e) {
			Rabto.ui.modalSubmit.disabled = false;
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
	Rabto.ui.modalTitle = document.getElementById('modal-title');
	Rabto.ui.modalDescription = document.getElementById('modal-description');
	Rabto.ui.modalFile = document.getElementById('modal-file');
	Rabto.ui.imageData = '';
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
	var data = {
		'title' : title,
		'description' : description,
		'replacedImageData' : replacedImageData
	}
	var url = window.location.origin + '/api/add/item/';
	Rabto.db.post(url, data, callback, true);
	console.log("[CLient add itemurl]",url)
};
