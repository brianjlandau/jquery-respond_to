/*
 * $.respondTo v0.1
 *   - jQuery plugin to dynamically handle different content types for an AJAX response
 *
 * Copyright (c) 2009 Brian Landau & Matt Henry
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 *
 * A large portion of this code is borrowed directly from jQuery core
 * and as such is licensed here accordingly:
 * Copyright (c) 2009 John Resig
 * Dual licensed under the MIT and GPL licenses.
 * http://docs.jquery.com/License
 *
 */

(function($) {
  function now(){
  	return +new Date;
  }
  
  $.extend({
    respondToSetup: function( settings ) {
  		jQuery.extend( jQuery.ajaxSettings, settings );
  	},

  	respondToSettings: {
  		url: location.href,
  		global: true,
  		type: "GET",
  		contentType: "application/x-www-form-urlencoded",
  		processData: true,
  		async: true,
  		// Create the request object; Microsoft failed to properly
  		// implement the XMLHttpRequest in IE7, so we use the ActiveXObject when it is available
  		// This function can be overriden by calling jQuery.ajaxSetup
  		xhr:function(){
  			return window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
  		},
  		accepts: "text/javascript, application/javascript, application/json, text/html, application/xml, text/xml, */*",
  		mimeTypes: {
  		  'text':    ['text/plain'],
    	  'json':    ['application/json'],
    	  'html':    ['text/html', 'application/xhtml+xml'],
    	  'xml':     ['application/xml', 'text/xml', 'application/x-xml'],
    	  'script':  ['text/javascript', 'application/javascript', 'application/x-javascript', 
    	              'text/ecmascript', 'application/ecmascript']
    	}
  	},

  	respondTo: function( s ) {
  		// Extend the settings, but re-extend 's' so that it can be
  		// checked again later (in the test suite, specifically)
  		s = jQuery.extend(true, s, jQuery.extend(true, {}, jQuery.respondToSettings, s));

  		var status, statusCode, contentType, data, type = s.type.toUpperCase();

  		// convert data if not already a string
  		if ( s.data && s.processData && typeof s.data !== "string" )
  			s.data = jQuery.param(s.data);

  		if ( type == "GET" ) {
  			var ts = now();
  			// try replacing _= if it is there
  			var ret = s.url.replace(/(\?|&)_=.*?(&|$)/, "$1_=" + ts + "$2");
  			// if nothing was replaced, add timestamp to the end
  			s.url = ret + ((ret == s.url) ? (s.url.match(/\?/) ? "&" : "?") + "_=" + ts : "");
  		}

  		// If data is available, append data to url for get requests
  		if ( s.data && type == "GET" ) {
  			s.url += (s.url.match(/\?/) ? "&" : "?") + s.data;

  			// IE likes to send both get and post data, prevent this
  			s.data = null;
  		}

  		// Watch for a new set of requests
  		if ( s.global && ! jQuery.active++ )
  			jQuery.event.trigger( "ajaxStart" );

  		// Matches an absolute URL, and saves the domain
  		var parts = /^(\w+:)?\/\/([^\/?#]+)/.exec( s.url );

  		var requestDone = false;

  		// Create the request object
  		var xhr = s.xhr();

  		// Open the socket
  		// Passing null username, generates a login popup on Opera (#2865)
  		if( s.username )
  			xhr.open(type, s.url, s.async, s.username, s.password);
  		else
  			xhr.open(type, s.url, s.async);

  		// Need an extra try/catch for cross domain requests in Firefox 3
  		try {
  			// Set the correct header, if data is being sent
  			if ( s.data )
  				xhr.setRequestHeader("Content-Type", s.contentType);

  			// Set header so the called script knows that it's an XMLHttpRequest
  			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

  			// Set the Accepts header for the server
  			xhr.setRequestHeader("Accept", s.accepts);
  		} catch(e){}

  		// Allow custom headers/mimetypes and early abort
  		if ( s.beforeSend && s.beforeSend(xhr, s) === false ) {
  			// Handle the global AJAX counter
  			if ( s.global && ! --jQuery.active )
  				jQuery.event.trigger( "ajaxStop" );
  			// close opended socket
  			xhr.abort();
  			return false;
  		}

  		if ( s.global )
  			jQuery.event.trigger("ajaxSend", [xhr, s]);

  		// Wait for a response to come back
  		var onreadystatechange = function(isTimeout){
  			// The request was aborted, clear the interval and decrement jQuery.active
  			if (xhr.readyState == 0) {
  				if (ival) {
  					// clear poll interval
  					clearInterval(ival);
  					ival = null;
  					// Handle the global AJAX counter
  					if ( s.global && ! --jQuery.active )
  						jQuery.event.trigger( "ajaxStop" );
  				}
  			// The transfer is complete and the data is available, or the request timed out
  			} else if ( !requestDone && xhr && (xhr.readyState == 4 || isTimeout == "timeout") ) {
  				requestDone = true;

  				// clear poll interval
  				if (ival) {
  					clearInterval(ival);
  					ival = null;
  				}

  				status = isTimeout == "timeout" ? "timeout" :
  					!jQuery.httpSuccess( xhr ) ? "error" : "success";
          statusCode = xhr.status;
          
          contentType = jQuery.httpContentType( xhr, s );
          
  				if ( status == "success" ) {
  					// Watch for, and catch, XML document parse errors
  					try {
  						// process the data (runs the xml through httpData regardless of callback)
  						data = jQuery.respondToData( xhr, s );
  					} catch(e) {
  						status = "parsererror";
  					}
  				}

  				// Make sure that the request was successful or notmodified
  				if ( status == "success" ) {
  					// Cache Last-Modified header, if ifModified mode.
  					var modRes;
  					try {
  						modRes = xhr.getResponseHeader("Last-Modified");
  					} catch(e) {} // swallow exception thrown by FF if header is not available

  					success();
  				} else
  					jQuery.handleError(s, xhr, statusCode);

  				// Fire the complete handlers
  				complete();

  				if ( isTimeout )
  					xhr.abort();

  				// Stop memory leaks
  				if ( s.async )
  					xhr = null;
  			}
  		};

  		if ( s.async ) {
  			// don't attach the handler to the request, just poll it instead
  			var ival = setInterval(onreadystatechange, 13);

  			// Timeout checker
  			if ( s.timeout > 0 )
  				setTimeout(function(){
  					// Check to see if the request is still happening
  					if ( xhr && !requestDone )
  						onreadystatechange( "timeout" );
  				}, s.timeout);
  		}

  		// Send the data
  		try {
  			xhr.send(s.data);
  		} catch(e) {
  			jQuery.handleError(s, xhr, null, e);
  		}

  		// firefox 1.5 doesn't fire statechange for sync requests
  		if ( !s.async )
  			onreadystatechange();

  		function success(){
  			// If a local callback was specified, fire it and pass it the data
  			if ( s.success )
  				s.success( data, contentType, statusCode );

  			// Fire the global callback
  			if ( s.global )
  				jQuery.event.trigger( "ajaxSuccess", [xhr, s] );
  				
			  if ($.isFunction(s[contentType]))
  		    s[contentType]( data, statusCode );
  		}

  		function complete(){
  			// Process result
  			if ( s.complete )
  				s.complete(xhr, statusCode);

  			// The request was completed
  			if ( s.global )
  				jQuery.event.trigger( "ajaxComplete", [xhr, s] );

  			// Handle the global AJAX counter
  			if ( s.global && ! --jQuery.active )
  				jQuery.event.trigger( "ajaxStop" );
  		}

  		// return XMLHttpRequest to allow aborting the request etc.
  		return xhr;
  	},
  	
  	httpContentType: function(xhr, s){
  	  var type, ct = xhr.getResponseHeader("content-type").split(';')[0];
  	  
  	  $.each(s.mimeTypes, function(name, mimes){
  	    if ($.inArray(ct, mimes) >= 0){
  	      type = name;
  	    }
  	  });
  	  
  	  if (!type)
  	    type = 'other';
  	  
  	  return type;
  	},

  	respondToData: function( xhr, s ) {
  		var ct = xhr.getResponseHeader("content-type"),
  			xml = ct && ct.indexOf("xml") >= 0,
  			data = xml ? xhr.responseXML : xhr.responseText;

  		if ( xml && data.documentElement.tagName == "parsererror" )
  			throw "parsererror";

  		// Allow a pre-filtering function to sanitize the response
  		// s != null is checked to keep backwards compatibility
  		if( s && s.dataFilter )
  			data = s.dataFilter( data, ct );

  		// The filter can actually parse the response
  		if( typeof data === "string" ){

  			// If the type is "script", eval it in global context
  			if ( (ct.indexOf("javascript") >= 0) || (ct.indexOf('ecmascript') >= 0) )
  				jQuery.globalEval( data );

  			// Get the JavaScript object, if JSON is used.
  			if ( ct.indexOf("json") >= 0 )
  				data = window["eval"]("(" + data + ")");
  		}

  		return data;
  	}

  });
})(jQuery);
