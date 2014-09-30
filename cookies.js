/* ECMAScript 5 Strict Mode */
"use strict";

var document_cookies = {
	get_cookie: function (key)
	/* Return value of cookie */
	{
		return decodeURIComponent(document.cookie.replace(
			new RegExp("(?:(?:^|.*;)\\s*" +
			encodeURIComponent(key).replace(/[\-\.\+\*]/g,
			"\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"),
			"$1")) || null;
	},
	
	set_cookie: function (key, value, exp, path, dom, ssl)
	/* Create or overwrite cookie */
	{
		if (!key ||
			/^(?:expires|max\-age|path|domain|secure)$/i.test(key))
		{
			return 1;
		}
		var _exp = "";
		if (exp) {
			switch (exp.constructor) {
				case Number:
					_exp = exp === Infinity ?
						"; expires=Fri, 31 Dec 9999" +
						"23:59:59 GMT" :
						"; max-age=" + exp;
					break;
				case String:
					_exp = "; expires=" + exp;
					break;
				case Date:
					_exp = "; expires=" + exp.toUTCString();
					break;
			}
		}
		document.cookie = encodeURIComponent(key) + "=" +
			encodeURIComponent(value) +
			_exp +
			(dom ? "; domain=" + dom : "") +
			(path ? "; path=" + path : "") +
			(ssl ? "; secure" : "");
		
		return 0;
	}
};
