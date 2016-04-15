var addslashes = function(str) { return ("" + str).replace(/[\\"]/g, '\\$&'); };

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

  this.body = function(request) {
    var json_body, multipart_body, name, raw_body, url_encoded_body, value;
    json_body = request.jsonBody;
    if (json_body) {
      return {
        "has_body": true,
        "has_json_body": true,
        "json_body_object": this.json_body_object(json_body, 2)
      };
    }
    url_encoded_body = request.urlEncodedBody;
    if (url_encoded_body) {
      return {
        "has_body": true,
        "has_url_encoded_body": true,
        "url_encoded_body": (function() {
          var results;
          results = [];
          for (name in url_encoded_body) {
            value = url_encoded_body[name];
            results.push({
              "name": addslashes(name),
              "value": addslashes(value)
            });
          }
          return results;
        })()
      };
    }
    multipart_body = request.multipartBody;
    if (multipart_body) {
      return {
        "has_body": true,
        "has_multipart_body": true,
        "multipart_body": (function() {
          var results;
          results = [];
          for (name in multipart_body) {
            value = multipart_body[name];
            results.push({
              "name": addslashes(name),
              "value": addslashes(value)
            });
          }
          return results;
        })()
      };
    }
    raw_body = request.body;
    if (raw_body) {
      if (raw_body.length < 5000) {
        return {
          "has_body": true,
          "has_raw_body": true,
          "raw_body": addslashes(raw_body)
        };
      } else {
        return {
          "has_body": true,
          "has_long_body": true
        };
      }
    }
  };

  this.json_body_object = function(object, indent) {
    var indent_str, indent_str_children, key, s, value;
    if (indent == null) {
      indent = 0;
    }
    if (object === null) {
      s = "null";
    } else if (typeof object === 'string') {
      s = "\"" + (addslashes(object)) + "\"";
    } else if (typeof object === 'number') {
      s = "" + object;
    } else if (typeof object === 'boolean') {
      s = "" + (object ? "true" : "false");
    } else if (typeof object === 'object') {
      indent_str = Array(indent + 1).join('  ');
      indent_str_children = Array(indent + 2).join('  ');
      if (object.length != null) {
        s = "[\n" + ((function() {
          var i, len, results;
          results = [];
          for (i = 0, len = object.length; i < len; i++) {
            value = object[i];
            results.push("" + indent_str_children + (this.json_body_object(value, indent + 1)));
          }
          return results;
        }).call(this)).join(',\n') + ("\n" + indent_str + "]");
      } else {
        s = "{\n" + ((function() {
          var results;
          results = [];
          for (key in object) {
            value = object[key];
            results.push(indent_str_children + "\"" + (addslashes(key)) + "\" => " + (this.json_body_object(value, indent + 1)));
          }
          return results;
        }).call(this)).join(',\n') + ("\n" + indent_str + "}");
      }
    }
    return s;
  };

  // implement the generate() method to generate code
  this.generate = function(context, requests, options) {
    var Mustache = require("mustache.js") || root.Mustache;

    var generated = "";

    // import the mustache template
    var template = readFile("spec.mustache");
    Mustache.parse(template);

    // get the headers
    request_headers = this.headers(context.getCurrentRequest());

    to_render = {
      spec_name: context.getCurrentRequest().name,
      headers: request_headers,
      request_method: context.getCurrentRequest().method.toLowerCase(),
      body: this.body(context.getCurrentRequest())
    };

    console.log(context.getCurrentRequest().method);

    generated += Mustache.render(template, to_render);

    return generated
  }
}

// set the extension identifier (must be same as the directory name)
miniracktest_codegenerator.identifier = "com.marianposaceanu.miniracktestcodegenerator";

// give a display name to your Code Generator
miniracktest_codegenerator.title = "Minitest, rack-test spec generator (Ruby)";

// call to register function is required
registerCodeGenerator(miniracktest_codegenerator)
