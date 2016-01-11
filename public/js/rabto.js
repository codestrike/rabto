var Rabto = {
	ui: {}, // UI interaction
	db: {}, // Database
	lib: {} // Generalized library
};

// Rabto.ui starts
Rabto.ui.init = function() {};

// Rabto.db starts
Rabto.db.request = function(method, url, data, callback, noJSON) {
	var xhr = new XMLHttpRequest();
	var body = null;

	if (method == 'get') {
		url = url + '?' + Rabto.lib.urlSerialize(data);
	} else {
		body = Rabto.lib.urlSerialize(data);
	}

	console.log('[db.request]', method, url, body);
	xhr.open(method, url, true);
	if (method == 'post') {
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	}

	xhr.send(body);

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
	};
}

Rabto.db.get = function(url, callback, noJSON) {
	Rabto.db.request('get', url, {}, callback, noJSON);
};

Rabto.db.post = function(url, data, callback, noJSON) {
	Rabto.db.request('post', url, data, callback, noJSON);
}

Rabto.db.init = function() {};

// Generalized library
Rabto.lib.urlSerialize = function(o) {
	if (!o) return '';
	return Object.keys(o).map(function(prop) {
	  return [prop, o[prop]].map(encodeURIComponent).join("=");
	}).join("&");
};
