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
        "has_multipart_body_pre": false,
        "json_body_object": this.json_body_object(json_body, 2)
      };
    }

    url_encoded_body = request.urlEncodedBody;
    if (url_encoded_body) {
      return {
        "has_body": true,
        "has_url_encoded_body": true,
        "has_multipart_body_pre": false,
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
        "has_multipart_body_pre": true,
        "has_multipart_body": false,
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

  this.get_path = function(request) {
    return request.getUrl(true).getComponentAtIndex(2);
  };

  // in order to render correct casted values
  this.add_handlebars_helper = function(h) {
    h.registerHelper("cast_item_with_action", function(object, key) {
      cast = ".must_equal ";

      if (object === null) {
        cast = "null";
      } else if (typeof object === 'string') {
        var filters = (
          object == 'id' ||
          key.includes('access_token') ||
          key.includes('refresh_token') ||
          key.includes('created') ||
          key.includes('updated')
        );

        if (filters) {
          cast = ".wont_be_nil";
        } else {
          cast += "'" + object + "'";
        }
      } else if (typeof object === 'number') {
        var filters = (
          key.includes('created') ||
          key.includes('updated')
        );

        if (filters) {
          cast = ".wont_be_nil";
        } else {
          cast += object;
        }
      } else if (typeof object === 'boolean') {
        cast += (object ? "true" : "false");
      } else if (typeof object === 'object') {
        cast += "JSON.parse <<-JSON";
        cast += "\n    " + JSON.stringify(object);
        cast += "\n    JSON"
      }

      return cast;
    });
  };

  // implement the generate() method to generate code
  this.generate = function(context, requests, options) {
    var request = context.getCurrentRequest();
    var response = request.getLastExchange();
    var generated = "";

    // import the Handlebars and init the template with helpers
    var Handlebars = require("handlebars-v4.0.5.js");
    this.add_handlebars_helper(Handlebars);
    var template = Handlebars.compile(readFile("spec.handlebars"));

    // we expect the response body to be JSON
    var response_body = null;
    if (response !== undefined) {
      response_body = JSON.parse(response.responseBody);
    };

    context = {
      spec_name: request.name,
      spec_description: request.description,
      headers: this.headers(request),
      request_method: request.method.toLowerCase(),
      body: this.body(request),
      path: this.get_path(request),
      response_body: response_body
    };

    // render the template with the context
    generated += template(context);

    return generated
  }
}

// set the extension identifier (must be same as the directory name)
miniracktest_codegenerator.identifier = "com.marianposaceanu.miniracktestcodegenerator";

// give a display name to your Code Generator
miniracktest_codegenerator.title = "Minitest, rack-test spec generator (Ruby)";

// call to register function is required
registerCodeGenerator(miniracktest_codegenerator)
