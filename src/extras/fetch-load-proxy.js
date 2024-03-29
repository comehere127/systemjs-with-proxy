import { errMsg } from "../err-msg.js";
/*
 * Fetch witch credentials
 */
(function (global) {
  var systemJSPrototype = global.System.constructor.prototype;

  systemJSPrototype.shouldFetch = function () {
    return false;
  };

  var instantiate = systemJSPrototype.instantiate;
  var jsContentTypeRegEx = /^(text|application)\/(x-)?javascript(;|$)/;
  systemJSPrototype.instantiate = function (url, parent) {
    var loader = this;
    if (!this.shouldFetch(url)) return instantiate.apply(this, arguments);
    return fetch(url, {
      credentials: "include",
    }).then(function (res) {
      if (!res.ok)
        throw Error(
          errMsg(
            7,
            process.env.SYSTEM_PRODUCTION
              ? [res.status, res.statusText, url, parent].join(", ")
              : res.status +
                  " " +
                  res.statusText +
                  ", loading " +
                  url +
                  (parent ? " from " + parent : "")
          )
        );
      var contentType = res.headers.get("content-type");
      if (!contentType || !jsContentTypeRegEx.test(contentType))
        throw Error(
          errMsg(
            4,
            process.env.SYSTEM_PRODUCTION
              ? contentType
              : 'Unknown Content-Type "' +
                  contentType +
                  '", loading ' +
                  url +
                  (parent ? " from " + parent : "")
          )
        );
      return res.text().then(function (source) {
        if (source.indexOf("//# sourceURL=") < 0)
          source += "\n//# sourceURL=" + url;
        (0, eval)(source);
        return loader.getRegister(url);
      });
    });
  };
})(typeof self !== "undefined" ? self : global);
