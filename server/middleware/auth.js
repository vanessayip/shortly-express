const models = require('../models');
const Promise = require('bluebird');
const cookieParser = require('./cookieParser.js');

module.exports.createSession = (req, res, next) => {
  // console.log('cookie header', req.headers.cookie);
  console.log('req.cookie', req.cookies);
  if (Object.keys(req.cookies).length === 0) {
    return models.Sessions.create()
    .then((promise) => {
      //hardcoded to id = 1, need to change to search based on user id when it isn't null
      // console.log('promise:', promise);
      // Get session id from promise
      return models.Sessions.get({id: promise.insertId});
    }).then((session) => {
      req.session = {};
      console.log(session);
      // console.log('session hash', session.hash);
      req.session.hash = session.hash;
      //WHY AN OBJ WITH VALUE PROPERTY?!?!?!
      console.log('Has shortlyid been set');
      res.cookies['shortlyid'] = {value: req.session.hash};
      // console.log('res.cookies: ', res.cookies);
      //check if userId is not null
      // console.log('session shouldnt be null', session);
      
      // if (session.userId !== null) {
      //   return models.Users.get({id: session.userId})
      //   .then((userInfo) => {
      //     console.log('userInfo: ', userInfo);
      //     req.session.user.username = userInfo.username;
      //     // req.session.userId = userInfo.id;
      //     next();
      //   });
      // }

      next();
      
    });
  } else {
    console.log('INSIDE ELSE');
    //cookie exists
    console.log('REQ COOKIES', req.cookies);
    // req.session = {hash: res.cookies.shortlyid.value};
    req.session = {hash: req.cookies.shortlyid};
    //console.log('REQ SESSION');
    return models.Sessions.get({hash: req.session.hash})
    .then((promise) => {
      
      console.log('promise inside else', promise);
      console.log('promise.user inside else', promise.user.username);
      console.log('req.session', req.session);
      req.session.user = {};
      req.session.user.username = promise.user.username;
      req.session.userId = promise.user.id;
      // return models.Users.get({id: promise.})
      next();  
    });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

