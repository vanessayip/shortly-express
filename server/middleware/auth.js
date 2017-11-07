const models = require('../models');
const Promise = require('bluebird');
const cookieParser = require('./cookieParser.js');

module.exports.createSession = (req, res, next) => {
  console.log('cookie header', req.headers.cookie);
  console.log('req.cookie', req.cookie);
  if (!req.headers.cookie) {
    return models.Sessions.create()
    .then(() => {
      //hardcoded to id = 1, need to change to search based on user id when it isn't null
      return models.Sessions.get({id: 1});
    }).then((session) => {
      req.session = {};
      // console.log(session)
      req.session.hash = session.hash;
      next();
      
    });
  }
  //cookieParser()
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

