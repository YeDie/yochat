/* ECMAScript 5 Strict Mode */
"use strict";

var form;
var username_valid = false;
var nametest_timeout;

function test_name() {
	document.querySelector("#p_username").innerHTML = "Checking...";
	window.clearTimeout(nametest_timeout);
	nametest_timeout = window.setTimeout(function () {
		var username = form.querySelector("#input_username").value;
		
		var request = get_request_object();
		
		request.addEventListener("load", function () {
			console.log(request.responseText);
			var userinfo = JSON.parse(request.responseText);
			if (userinfo.avalible) {
				username_valid = true;
				form.querySelector("#p_username").innerHTML = (
					"OK."
				);
				validate_form();
			}
			else {
				form.querySelector("#p_username").innerHTML = (
					"Already taken."
				);
				username_valid = false;
				validate_form();
			}
		});
		request.open("POST", "./get_userinfo.php", true);
		request.setRequestHeader(
			"Content-Type",
			"application/x-www-form-urlencoded"
		);
		request.send(
			"user_name=" + username +
			"&get_avability=true"
		);
	}, 500);
}

function validate_form() {
	var email = form.querySelector("#input_email").value;
	
	var password1 = form.querySelector("#input_password").value;
	var password2 = form.querySelector("#input_password_confirm").value;
	
	var retval = 0;
	
	if (!username_valid) {
		retval = 1;
	}
	if (!is_rfc822_email(email)) {
		form.querySelector("#p_email").innerHTML = "Invalid";
		retval = 2;
	}
	else {
		form.querySelector("#p_email").innerHTML = "OK.";
	}
	
	if (password1 === "") {
		form.querySelector("#p_password1").innerHTML = "Empty";
		retval = 3;
	}
	else {
		form.querySelector("#p_password1").innerHTML = "OK.";
	}
	
	if (password1 !== password2) {
		form.querySelector("#p_password2").innerHTML = "Doesn't match.";
		retval = 4;
	}
	else if (password1 === "") {
		form.querySelector("#p_password2").innerHTML = "";
	}
	else {
		form.querySelector("#p_password2").innerHTML = "OK.";
	}
	
	if (retval === 0) {
		form.querySelector("#input_submit").disabled = false;
		
		return 0;
	}
	else {
		form.querySelector("#input_submit").disabled = true;
		
		return retval;
	}
}

function is_rfc822_email(address) {
	var expr = (
		/^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/
	);
	
	return expr.test(address);
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

function init_form() {
	form = document.querySelector("#register_form");
	form.querySelector("#input_submit").disabled = true;
}

window.onload = init_form;
