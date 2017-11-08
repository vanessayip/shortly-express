const models = require('../models');
const Promise = require('bluebird');
const cookieParser = require('./cookieParser.js');

module.exports.createSession = (req, res, next) => {
  //use Promise.resolve(req.cookies.shortlyid) to promisify the string so that you can start chaining the promises. don't need this, can also do the if else, but since we're already going to use promise, might as well
  //need to check if there is a hash or not, so need to promisfy the string
  //only way to do that is to Promise.resolve(string) since the resolve is what gets passed down
  //if something doesn't work out, can use catch. catch will catch everything above it. ie when to make a session. this will happen when you use throw
  //if stuff inside catch is handled correctly, thens after catch will run
  //inside catch, there is a return b/c want to pass the final value of the promise chain to the next then block
  //most websites create a session when a user (atm unknown. ie not logged in) lands on the site. so session is not associated with a user until the user is logged in
  //tap is like then, but doesn't expect return value. what got passed into tap will get passed on to the next then block 
  
  
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
      console.log('SESSION', session);
      req.session.hash = session.hash;
      // console.log('res.cookies', res.cookies);
      // res.cookie('shortlyid', {value: req.session.hash});
      res.cookie('shortlyid', req.session.hash);
      
      res.cookies = {};
      //WHY AN OBJ WITH VALUE PROPERTY?!?!?!
      res.cookies['shortlyid'] = {value: req.session.hash};
      //console.log('RES COOKIES BEING SET', res.cookies);
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
    // console.log('INSIDE ELSE');
    //cookie exists
    console.log('REQ COOKIES', req.cookies);
    // req.session = {hash: res.cookies.shortlyid.value};
    
    req.session = {hash: req.cookies.shortlyid};
    //console.log('REQ SESSION');
    return models.Sessions.get({hash: req.session.hash})
    .then((promise) => {
      
      // console.log('promise inside else', promise);
      //console.log('promise.user inside else', promise.user.username);
      // console.log('req.session', req.session);
      if (promise.userId) {
        req.session.user = {};
        req.session.user.username = promise.user.username;
        req.session.userId = promise.user.id;

      }
      // return models.Users.get({id: promise.})
      next();  
    })
    .catch((err) => {
    //check cookie's hash for validity
      //console.log('err: ', err);
      req.cookies = {};
      module.exports.createSession(req, res, next);
    });
    
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

