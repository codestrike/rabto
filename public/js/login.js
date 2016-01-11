// UI
Rabto.ui.login = {};

Rabto.ui.login.init = function() {
	// Rabto.ui.login.form = document.getElementById('login-form');
	Rabto.ui.login.email = document.getElementById('login-email');
	Rabto.ui.login.pass = document.getElementById('login-pass');
	Rabto.ui.login.btn = document.getElementById('login-btn');

	Rabto.ui.login.initEvents();
};

Rabto.ui.login.initEvents = function() {
	var context = Rabto.ui.login;
	context.btn.addEventListener('click', function(e) {
		e.preventDefault();
		Rabto.db.login.makeLogin(context.email.value, context.pass.value, function(d) {
			if (d.err) {
				console.log('[ui.login.btn click]', d.err);
			} else {
				window.location = window.location.origin + d.location;
			}
		});
	});
};

// DB
Rabto.db.login = {}

Rabto.db.login.init = function() {};

Rabto.db.login.makeLogin = function(email, pass, callback) {
	Rabto.db.post(window.location.origin + '/session/start', {
		email: email,
		pass: pass
	}, callback);
}