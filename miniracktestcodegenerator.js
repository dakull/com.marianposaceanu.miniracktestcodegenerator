var miniracktest_codegenerator = function() {


  this.headers = function(request) {
    var header_name, header_value, headers;
    headers = request.headers;

    return {
      "has_headers": Object.keys(headers).length > 0,
      "header_list": (function() {
        var results;
        results = [];
        for (header_name in headers) {
          header_value = headers[header_name];
          results.push({
            "header_name": header_name,
            "header_value": header_value
          });
        }
        return results;
      })()
    };
  };


  // implement the generate() method to generate code
  this.generate = function(context, requests, options) {
    var Mustache = require("mustache.js") || root.Mustache;

    var generated = "";

    // import the mustache template
    var template = readFile("spec.mustache");
    // Mustache.parse(template);
    //
    request_headers = this.headers(context.getCurrentRequest());

    generated += Mustache.render(template, { headers: request_headers });

    return generated
  }
}

// set the extension identifier (must be same as the directory name)
miniracktest_codegenerator.identifier = "com.marianposaceanu.miniracktestcodegenerator";

// give a display name to your Code Generator
miniracktest_codegenerator.title = "Minitest, rack-test spec generator";

// call to register function is required
registerCodeGenerator(miniracktest_codegenerator)
