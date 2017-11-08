const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const cookieParser = require('./middleware/cookieParser.js');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser);
app.use(Auth.createSession);
app.use(express.static(path.join(__dirname, '../public')));



app.get('/', 
(req, res, next) => {
  res.render('index');
});

app.get('/create', 
(req, res) => {
  res.render('index');
});

app.get('/links', 
(req, res, next) => {
  models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});

app.post('/links', 
(req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/signup', (req, res, next) => {
  var username = req.body.username;
  var password = req.body.password;

  return models.Users.get({username: username})
  .tap(user => {
    if (user) {
      res.redirect('/signup');
      return;
    } else {
      return models.Users.create({username, password})
      .then((userCreated) => {
        console.log('userCreated', userCreated);
        console.log('IM IN HERE', req.session);
        return models.Sessions.update({hash: req.session.hash}, {userId: userCreated.insertId})
        .then(() => {
          res.redirect('/');
          res.status(201).send();
        })
        .catch((error) => {
          console.log('error from update', error);
        });
      })
      .catch(error => {
        console.log('error inside post after create /signup: ', error);
      });
    }
  })
  .catch(error => {
    console.log('error inside post /signup: ', error);
  });
  
});

app.get('/signup', (req, res, next) => {
  res.render('signup');
});

app.post('/login', (req, res, next) => {
  var username = req.body.username;
  var password = req.body.password;

//search if user is in db
//compare if user info matches db
//create a session
//return cookie with session
//redirect to '/'
  var user;
  return models.Users.get({username: username})
  .tap(userInfo => {
    user = userInfo;
    if (user) {
      console.log('user inside LOGIN: ', user);
      if (models.Users.compare(password, user.password, user.salt)) {
        models.Sessions.update({hash: req.session.hash}, {userId: user.id})
        .then (() => {
          res.redirect('/');
        });
        // return models.Sessions.create()
        // .then((sesh) => {
        //   console.log('sesh: ', sesh);
        //   console.log('req cookie', req.cookie);
        //   return models.Sessions.get({userId: user.id})
        //   .then((session) => {
        //     console.log('inside ', session);
        //   });
        // });
      } else {
        console.log('error: you entered wrong password');
        res.redirect('/login');
      }
      // .then((bool) => {
      //   if (bool) {
      //     return models.Sessions.create()
      //     .then(() => {
      //       models.Sessions.get({id: session.userId});
      //     });  
        // } else {
        //   console.log('error: no user found');
        //   res.redirect('/login');
      //  }
        
     // });
    
    } else {
      console.log('error: user not found');
      res.redirect('/login');
    }
  })
  .catch(error => {
    console.log('error inside post /login: ', error);
  });
  
});

app.get('/login', (req, res, next) => {
  res.render('login');
});

app.get('/logout', (req, res, next) => {
  console.log('hello');
  //res.clearCookie('shortlyid');
  res.cookie('shortlyid', '');
  return models.Sessions.delete({hash: req.session.hash})
  .then((promise) => {
    console.log('promise after delete: ', promise);
    
    res.render('index');
  })
  .catch((error) => {
    console.log('error after delete: ', error);
  });
  //res.clearCookie('shortlyid');
  //   res.clearCookie('shortlyid');
  //   res.render('index');
    
  // })
  // .catch((error) => {
  //   console.log('error with deleting hash: ', error);
  // });
});

app.post('/logout', (req, res, next) => {
  console.log('IM INSIDE POST');
  return models.Sessions.delete({hash: req.session.hash})
  .then(() => {
    res.clearCookie('shortlyid');
    res.render('index');
    
  })
  .catch((error) => {
    console.log('error with deleting hash: ', error);
  });
});
/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
