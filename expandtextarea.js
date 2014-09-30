/* ECMAScript 5 Strict Mode */
"use strict";

var pre;
var textarea;
var span;

function make_expanding(element) {
	element.className = element.className + " active";
	pre = element.querySelector("pre");
	span = element.querySelector("span");
	textarea = element.querySelector("textarea");
	textarea.addEventListener("input", function () {
		span.textContent = textarea.value;
	}, false);
	span.textContent = textarea.value;
}
