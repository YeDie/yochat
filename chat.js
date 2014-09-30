/* ECMAScript 5 Strict Mode */
"use strict";
/* This makes JavaScript throw a few more errors on  */

/* Globals */
var message_template = [0, "name", "message", 0];
var loading_message = [0, "System", "Loading messages...", Date.now()];
var message_count = 0;
var message_limit = 10;
var refresh_rate = 10000;
var refresh_interval;
var last_message_id = 0;
var input_textarea = true;
var input_size = 3;
var form;

var keyring;

var verbose_mode = true;


function refresh_message_container() {
	/* GET the message loader update messages */
	
	var request = get_request_object();
	request.addEventListener("load", update_messages);
	request.open(
		"GET",
		"./get_messages.php?message_limit=" + message_limit +
		"&last_message_id=" + last_message_id,
		true
	);
	
	request.send();
}

function post_message(data) {
	/* POST a message and refresh message loader */
	
	form.querySelector("#input_submit").disabled = true;
	var reenable_submit = window.setTimeout(function () {
		form.querySelector("#input_submit").disabled = false;
	}, 1000);
	var message_guest_name = data.querySelector("#input_guest_name").value;
	document_cookies.set_cookie("guest_name", message_guest_name);
	var message_content = data.querySelector("#textarea_message").value;
	if (message_content.trim() === "") {
		message_content = data.querySelector("#input_message").value;
		data.querySelector("#textarea_message").focus();
	}
	else {
		data.querySelector("#input_message").focus();
	}
	
	message_content = encrypt_message(message_content);
	
	var request = get_request_object();
	request.open("POST", "./post_message.php", true);
	request.setRequestHeader(
		'Content-Type',
		'application/x-www-form-urlencoded'
	);
	request.send(
		"guest_name=" + encodeURIComponent(message_guest_name) +
		"&message_content=" + encodeURIComponent(message_content)
	);
	
	data.querySelector("#input_message").value = "";
	data.querySelector("#textarea_message").value = "";
	if (input_textarea) {
		data.querySelector("#textarea_message").focus();
	}
	else {
		data.querySelector("#input_message").focus();
	}
	
	refresh_message_container();
}

function update_messages(e) {
	/* Add new JSON-encoded messages and remove old ones if necessary */
	
	var messages = JSON.parse(e.target.responseText);
	var container = document.querySelector("#message_container");
	
	messages.forEach(function (message) {
		if (message[0] > last_message_id) {
			/* Insert new message */
			if (verbose_mode) {
				console.log("adding: " + message);
			}
			var html = message_to_html(message);
			container.insertBefore(
				html, container.firstChild
			);
			message_count++;
			last_message_id = message[0];
		}
		if (message_count > message_limit) {
			/* Pop old message */
			container.lastElementChild.remove();
			message_count--;
		}
	});
}

function message_to_html(message) {
	/* Turn message into usable HTML elements */
	
	var message_content = decrypt_message(message[2]);
	message_content = message_content.replace("\r\n", "<br />", "gi");
	message_content = message_content.replace("\r", "<br />", "gi");
	message_content = message_content.replace("\n", "<br />", "gi");
	/* We replace newlines with HTML breaklines trice,
	first for Windows CRLF newlines, then for ancient MacOS CR newlines,
	and lastly Unix and others' LF newlines */
	
	var timestamp = new Date(parseInt(message[3]) * 1000);
	/* Message time is in seconds after 1970-01-01 (POSIX time),
	but Date wants it in milliseconds, so we multiply by 1000 here */
	
	var tr = document.createElement("tr");
	var td1 = document.createElement("td");
	var td2 = document.createElement("td");
	tr.id = "message_id_" + message[0];
	var p1 = document.createElement("p");
	var p2 = document.createElement("p");
	p1.innerHTML = message[1] + ": " + message_content;
	p1.className = "message_content";
	p2.innerHTML = "#" + message[0] + " @" + timestamp.toString();
	p2.className = "message_info";
	td1.appendChild(p1);
	td1.width = "512";
	td2.appendChild(p2);
	tr.appendChild(td1);
	tr.appendChild(td2);
	
	return tr;
}

function encrypt_message(message) {
	/* Encrypt message with selected public key */
	
	var key_id = form.querySelector("#input_publickey").value;
	if (key_id !== "none") {
		message = openpgp.encryptMessage(
			keyring.publicKeys.getForId(key_id), message
		);
	}
	
	return message;
}

function decrypt_message(message) {
	/* Try to decrypt message with private key */
	
	if (message.startsWith("-----BEGIN PGP MESSAGE-----")) {
		if (keyring.privateKeys.keys[0]) {
			var message_message = (
				openpgp.message.readArmored(message)
			);
			try {
			message = message_message.decrypt(
				keyring.privateKeys.keys[0], message_message
			).getText();
			}
			catch (err) {
				if (verbose_mode) {
					console.log("decryption failed");
				}
			}
		}
	}
	if (message.startsWith("-----BEGIN PGP MESSAGE-----")) {
		message = "-----ENCRYPTED MESSAGE-----";
	}
	
	return message;
}

function generate_keypair() {
	/* Generate a public and private key asynchronously */
	
	form.querySelector("#keygen_message").hidden = false;
	var keysize = parseInt(form.querySelector("#input_keysize").value);
	var keyname = form.querySelector("#input_guest_name").value;
	var passphrase = form.querySelector("#input_key_password").value;
	var confirm_passphrase = (
		form.querySelector("#input_key_password_confirm").value
	);
	if (passphrase === confirm_passphrase) {
		var options = {
			numBits: keysize,
			userId: keyname,
			passphrase: passphrase
		};
		
		/* Generate keypair asynchronously (in the background)
		to not kill the rest of the script */
		var proxy = new openpgp.AsyncProxy();
		proxy.generateKeyPair(options, function (err, data) {
			keyring.privateKeys.importKey(data.privateKeyArmored);
			keyring.publicKeys.importKey(data.publicKeyArmored);
			keyring.store();
			form.querySelector("#keygen_message").hidden = true;
			window.alert(
				"Keypair for user " + keyname + " generated."
			);
		});
	}
}

function copy_public_key() {
	var key_id = form.querySelector("#input_publickey").value;
	if (key_id !== "none") {
		var public_key = keyring.publicKeys.getForId(key_id);
		form.querySelector("#input_message").value += (
			public_key.armor()
		);
	}
}

function copy_private_key() {
	var private_key = keyring.privateKeys.keys[0];
	window.prompt("Ctrl+C to copy", private_key.armor());
}

function import_public_key() {
	var public_key = form.querySelector("#input_publickey_import").value;
	console.log(keyring.publicKeys.importKey(public_key));
	keyring.store();
	window.alert("Key imported.");
}

function clear_keyring() {
	if (window.confirm("Are you sure you want to clear the keyring?")) {
		keyring.clear();
		keyring.store();
	}
}

function toggle_options_menu() {
	form.querySelector("#options_menu").hidden = (
		!form.querySelector("#options_menu").hidden
	);
}

function toggle_encryption_menu() {
	form.querySelector("#encryption_menu").hidden = (
		!form.querySelector("#encryption_menu").hidden
	);
}

function save_options() {
	/* Save options to cookies that expires with the session */
	
	var message_limit_value = (
		form.querySelector("#input_message_limit").value
	);
	var refresh_rate_value = (
		form.querySelector("#input_refresh_rate").value
	);
	var theme_value = form.querySelector("#input_theme").value;
	var input_size_value = form.querySelector("#input_input_size").value;
	
	var message_limit_int = parseInt(message_limit_value);
	if (message_limit_int > 1 && message_limit_int <= 100) {
		message_limit = message_limit_int;
		document_cookies.set_cookie("message_limit", message_limit);
	}

	var refresh_rate_int = parseInt(refresh_rate_value);
	if (refresh_rate_int > 5000) {
		refresh_rate = refresh_rate_int;
		window.clearInterval(refresh_interval);
		refresh_interval = window.setInterval(refresh_message_container, refresh_rate);
		document_cookies.set_cookie("refresh_rate", refresh_rate);
	}
	
	var input_size_int = parseInt(input_size_value);
	if (input_size_int > 0) {
		input_size = input_size_int;
		document_cookies.set_cookie("input_size", input_size);
	}
	if (input_size === 1) {
		form.querySelector("#input_message").hidden = false;
		form.querySelector("#textarea_message").hidden = true;
		input_textarea = false;
		if (form.querySelector("#textarea_message").value.trim() !== "") {
			form.querySelector("#input_message").value = (
				form.querySelector("#textarea_message").value
			);
		}
	}
	if (input_size > 1) {
		form.querySelector("#input_message").hidden = true;
		form.querySelector("#textarea_message").hidden = false;
		input_textarea = true;
		if (form.querySelector("#input_message").value.trim() !== "") {
			form.querySelector("#textarea_message").value = (
				form.querySelector("#input_message").value
			);
		}
	}
	
	set_active_theme(theme_value);
	save_theme();
	form.querySelector("#options_menu").hidden = true;
}

function load_options() {
	/* Load options from cookies */
	
	if (document_cookies.get_cookie("guest_name") !== null) {
		form.querySelector("#input_guest_name").value = (
			document_cookies.get_cookie("guest_name")
		);
		message_limit = parseInt(document_cookies.get_cookie("message_limit"));
	}
	
	if (document_cookies.get_cookie("message_limit") !== null) {
		form.querySelector("#input_message_limit").value = (
			document_cookies.get_cookie("message_limit")
		);
		message_limit = parseInt(document_cookies.get_cookie("message_limit"));
	}
	
	if (document_cookies.get_cookie("refresh_rate") !== null) {
		form.querySelector("#input_refresh_rate").value = (
			document_cookies.get_cookie("refresh_rate")
		);
		refresh_rate = parseInt(document_cookies.get_cookie("refresh_rate"));
	}

	if (document_cookies.get_cookie("theme") !== null) {
		form.querySelector("#input_theme").value = (
			document_cookies.get_cookie("theme")
		);
	}
	
	if (document_cookies.get_cookie("input_size") !== null) {
		if (document_cookies.get_cookie("input_size") === "1") {
			form.querySelector("#input_message").hidden = false;
			form.querySelector("#textarea_message").hidden = (
				true
			);
			input_textarea = false;
		}
		else {
			input_textarea = true;
		}
	}
	
	var container = document.querySelector("#message_container");
	container.appendChild(message_to_html(loading_message));
	refresh_message_container();
	if (container.querySelector("#message_id_0") !== null) {
		container.querySelector("#message_id_0").remove();
	}
}

function for_nodes(nodelist, callback, scope) {
	/* Do something for each node in a NodeList */
	
	for (var i = 0; i < nodelist.length; i++) {
		callback.call(scope, i, nodelist[i]);
	}
}

function get_request_object() {
	/* Get appropriate HTTP request object for browser */
	
	var object;
	if (typeof XMLHttpRequest === "function") {
		/* Good browsers */
		object = new XMLHttpRequest();
	}
	else {
		/* Internet Explorer */
		object = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	return object;
}

function init_chat() {
	/* Initialize everything */
	
	load_theme();
	
	form = document.querySelector("#message_form");
	
	init_enc();
	
	load_options();
	
	/* Ctrl+Enter to submit */
	form.querySelector("#textarea_message").onkeydown = function (e) {
		if (e.keyCode === 13 && e.ctrlKey) {
			form.querySelector("#input_submit").click();
		}
	};
	
	refresh_interval = window.setInterval(
		refresh_message_container, refresh_rate
	);
	
	for_nodes(document.querySelectorAll(".expanding"), function (index, element) {
		make_expanding(element);
	});
	
	for_nodes(document.querySelectorAll(".expanding"), function (index, element) {
		make_expanding(element);
	});
}

function init_enc() {
	keyring = new openpgp.Keyring();
	
	var input_publickey = form.querySelector("#input_publickey");
	keyring.publicKeys.keys.forEach(function (key) {
		var option = document.createElement("option");
		option.innerHTML = key.users[0].userId.userid;
		option.value = key.getKeyIds()[0].toHex();
		input_publickey.appendChild(option);
	});
	keyring.privateKeys.keys.forEach(function (key) {
		/* TODO: Passphrase input */
		key.decrypt("123");
	});
}

window.onload = init_chat;
