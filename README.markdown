jQuery respondTo
=================

Plugin to dynamically handle different content types for an AJAX response.


## Usage

Should be nearly identical in usage to the built-in `$.ajax` method except
automatically post-processing response data according to incoming mime-type,
and the parameters passed to the `success` callback.
Those are now:  
`( data, contentType, statusCode )`

Where `data` is the same as it always has been, `contentType` is a string representation
of the content type, and `statusCode` is the actual numerical HTTP status code
returned from the server.

You can also use custom content-type callbacks such as `html`, `json`, and `script`.
The callback for the respective content-type will be called immediately after the success callbacks.

The way the content type is determined is by the `jQuery.respondToSettings.mimeTypes` value.
By default this is set to:

    {
      'text':    ['text/plain'],
      'json':    ['application/json'],
      'html':    ['text/html', 'application/xhtml+xml'],
      'xml':     ['application/xml', 'text/xml', 'application/x-xml'],
      'script':  ['text/javascript', 'application/javascript', 'application/x-javascript', 
                  'text/ecmascript', 'application/ecmascript']
    }

If the content-type header is not found in one of the listed MIME types,
then a content-type of "`other`" is returned.

While not API identical to the built-in `$.ajax` function,
`$.respondTo` should be able to be used as a drop-in replacement for it in most cases.
Places where there could be a potential problem is plugins or existing code
that depend on the `dataType` setting,
or where global `ajaxSettings` have been defined and are being used.

To replace the built-in ajax function with the respond to function add this line:

    jQuery.ajax = jQuery.respondTo;


## Examples

Using the content-type specific callback functions to have 
different success behavior based on content-type:

    $.respondTo({
      url: '/people/37',
      html: function(html, status){
        // handle HTML response
      },
      json: function(json, status){
        // handle JSON response
      }
    });


Using the typical `success` callback but with the new arguments:

    $.respondTo({
      url: '/people/37',
      success: function(data, contentType, status){
        // example values:
        //   data: {id: 20, title: "Another Blog Post"}
        //   contentType: "json"
        //   status: 201
      }
    });


Copyright (c) 2009 Brian Landau & Matt Henry, released under the MIT license
