// UI
Rabto.ui.shell = {};

Rabto.ui.shell.init  = function () {
	var context = Rabto.ui.shell;
	context.shellMenu = document.getElementById('shell-menu');
	context.modalSave = document.getElementById('modal-save');
	context.username = document.getElementById('shell-user');
	context.modalName = document.getElementById('modal-name');
	context.modalEmail = document.getElementById('modal-email');
	context.modalMobile = document.getElementById('modal-mobile');
	context.profilePicture = document.getElementById('shell-profile-picture');

	context.populateUserData();
	context.initEventListeners();
};

Rabto.ui.shell.initEventListeners = function() {
	var context = Rabto.ui.shell;
	var db = Rabto.db.shell;

	context.shellMenu.addEventListener('click', function(e) {
		context.populateProfileData(db.getUser());
		window.location = window.location.origin + '/#shell-sidebar';
	});

	context.modalSave.addEventListener('click', function(e) {
		context.modalSave.disabled = true;
		db.updateUser(context.modalName.value, function(d) {
			var user = db.getUser();
			user.name = context.modalName.value;
			db.setUser(user);
			context.populateUserData();
			context.modalSave.disabled = false;
			window.location = window.location.origin + '/#';
		});
	});
}

Rabto.ui.shell.populateUserData = function() {
	var context = Rabto.ui.shell;
	var user = Rabto.db.shell.getUser(function(user) {
		console.log('[ui.shell.populateUserData user]', user);
		context.username.innerHTML = user.displayName;
		context.profilePicture.style.background = 'url("' + user.photos[0].value.replace('?sz=50', '?sz=128') +'")'; 
		Rabto.ui.shell.populateProfileData(user);
	});
};

Rabto.ui.shell.populateProfileData = function(user) {
	var context = Rabto.ui.shell;
	// context.modalName.value = user.displayName;
	// context.modalEmail.value = user.email;
	// context.modalMobile.value = user.mobile;
};

// DB
Rabto.db.shell = {};

Rabto.db.shell.init = function() {};

Rabto.db.shell.getUser = function(callback) {
	Rabto.db.get(window.location.origin + '/api/get/user', callback);
};

Rabto.db.shell.setUser = function(user) {
	localStorage.setItem('user', JSON.stringify(user));
}

Rabto.db.shell.updateUser = function(name, callback) {
	console.log('[db.shell.updateUser]', name, Rabto.db.shell.getUser().id);
	Rabto.db.post(window.location.origin + '/api/update/user', {
		user_name: name, 
		id: Rabto.db.shell.getUser().id
	}, callback, true);
}