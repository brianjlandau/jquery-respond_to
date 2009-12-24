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

## Examples

TODO


Copyright (c) 2009 Brian Landau & Matt Henry, released under the MIT license
