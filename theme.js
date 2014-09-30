/* ECMAScript 5 Strict Mode */
"use strict";

function set_active_theme(name) {
	var i, element;
	for (i = 0; (
		element = document.getElementsByTagName("link")[i]
	); i++) {
		if (
			element.getAttribute("rel").indexOf("style") !== -1 &&
			element.getAttribute("title")
		) {
			if (element.getAttribute("title") === name) {
				element.disabled = false;
			}
			else {
				element.disabled = true;
			}
		}
	}
	
	return 0;
}

function get_active_theme() {
	var i, element;
	for (i = 0; (
		element = document.getElementsByTagName("link")[i]
	); i++) {
		if (
			element.getAttribute("rel").indexOf("style") !== -1 &&
			element.getAttribute("title") &&
			element.disabled === false
		) {
			return element.getAttribute("title");
		}
	}
	
	return null;
}

function save_theme() {
	var current_theme = get_active_theme();
	document_cookies.set_cookie("theme", current_theme);
	
	return 0;
}

function load_theme() {
	var saved_theme = document_cookies.get_cookie("theme");
	if (saved_theme === null) {
		return 1;
	}
	
	set_active_theme(saved_theme);
	
	return 0;
}
