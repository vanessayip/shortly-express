const queryString = require('query-string');

const parseCookies = (req, res, next) => {
  //can use .get (part of req module), and use it to get any obj on the req obj
  req.cookies = {};
  //in the network tab, you'll see cookies tab if there are cookies
  //console.log('cookies: ', req.headers.cookie);
  //console.log('typeofcookie', typeof req.headers.cookie);
  var cookiesHeader = req.headers.cookie;
  //console.log('req cookies', req.headers.cookie);
  if (!cookiesHeader) {
    console.log('empty cookie');
  } else if (cookiesHeader.indexOf(';') !== -1) {
    var splitCookie = cookiesHeader.split(';');
    for (var i = 0; i < splitCookie.length; i++) {
      var tupleCookie = splitCookie[i].split('=');
      req.cookies[tupleCookie[0].trim()] = tupleCookie[1].trim();
    }
  } else {
    req.cookies = queryString.parse(req.headers.cookie);
  }
  console.log('req.cookies:', req.cookies);
  next(); //cuz this is a middleware, need to put next to move on to the next middleware fn
};

module.exports = parseCookies;