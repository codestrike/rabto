// UI
Rabto.ui.shell = {};

Rabto.ui.shell.init  = function () {
	var context = Rabto.ui.shell;
	context.shellMenu = document.getElementById('shell-menu');
	context.username = document.getElementById('shell-user');
	context.modalName = document.getElementById('modal-name');
	context.modalEmail = document.getElementById('modal-email');
	context.modalMobile = document.getElementById('modal-mobile');

	context.populateUserData();
	context.initEventListeners();
};

Rabto.ui.shell.initEventListeners = function() {
	var context = Rabto.ui.shell;
	var db = Rabto.db.shell;
	context.shellMenu.addEventListener('click', function() {
		context.populateProfileData(db.getUser());
		window.location = window.location.origin + '/#profileModal';
	});
}

Rabto.ui.shell.populateUserData = function() {
	var context = Rabto.ui.shell;
	var user = Rabto.db.shell.getUser();

	context.username.innerHTML = user.name;
	Rabto.ui.shell.populateProfileData(user);
};

Rabto.ui.shell.populateProfileData = function(user) {
	var context = Rabto.ui.shell;
	context.modalName.value = user.name;
	context.modalEmail.value = user.email;
	context.modalMobile.value = user.mobile;
};

// DB
Rabto.db.shell = {};

Rabto.db.shell.init = function() {};

Rabto.db.shell.getUser = function() {
	return JSON.parse(localStorage.getItem('user') || {
		name: null,
		email: null,
		mobile: '0000'
	});
};