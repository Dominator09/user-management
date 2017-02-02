const Hapi   = require('hapi');
var mysql    = require('mysql');
var jwt      = require('jsonwebtoken');
var path     = require('path');

const server = new Hapi.Server();
// Create a server with a host and port
server.connection({
    host: '192.168.122.1',
    port: 8000
});


var pool = mysql.createPool({
  connectionLimit : 100,
  host            : 'localhost',
  user            : 'root',
  password        : 'elnino',
  database        : 'hapi'
});


/*
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'elnino',
  database : 'hapi'
});
*/


server.register(require('hapi-auth-basic'), function (err) {

    if(err) {
        throw err;
    }

    server.auth.strategy('simple', 'basic', {
        validateFunc: function (request, username, password, callback){
            pool.getConnection(function(err,connection){
                if(err) throw err;
                console.log("auth con created");
                connection.query("select * from users",function(err,rows,feilds)
                {   if(err)
                    throw err;
                    var flag=false;
                   console.log("auth query made");

                    for(x in rows)
                    {  console.log("in loop");
                      if(username == rows[x].ID && rows[x].roles == 'admin')
                      { flag=true;
                        console.log("admin found ");
                        return callback(null, true, {scope: 'admin'});
                      }
                      else if (username == rows[x].ID && rows[x].roles == 'user') {
                         flag=true;
                         console.log("user found ");
                          return callback(null, true, {scope: 'user'}); // They're a `user`
                      }
                      else
                        { console.log("nothing found");
                          }
                   }
                   if(flag ==false)
                   {
                     return callback(null,false);
                   }

                });

                   connection.release();
            });


        }
    });

    server.route([{
            config: {
                auth: {
                    strategy: 'simple',
                    scope: ['admin']                    // Only admin
                },
            },
            method: 'GET',
            path: '/admin2',
            handler: function(request, reply) {

              var userid = [];
              var userpass = [];

              pool.getConnection(function(err,connection){
              if (err) {
                reply("Error in connection database");
              }


              connection.query('SELECT * from users', function(err, rows, fields){
                if (err) throw err;
                console.log("ok2");
                for(x in rows)
                {
                      userid.push(rows[x].ID);
                      userpass.push(rows[x].password);

                 }
                 return reply.view('admin',{idd : userid, passf: userpass});


              });

               connection.release();
             });
            }
        }, {
            config: {
                auth: {
                    strategy: 'simple',
                    scope: ['user', 'admin']            // user or admin
                },
            },
            method: 'GET',
            path: '/user',
            handler: function(request, reply) {

                reply('User page');
            }
        }
    ]);




server.register(require('vision'),function(err){

    if(err) throw err;

// Add the route

server.route({
  method: 'GET',
  path  : "/signup",
  handler : function(request,reply){

    var params = request.query;
    var post = {ID:params.email, password:params.pass1, roles: "admin"};

    pool.getConnection(function(err,connection){
    if (err) {
      reply("Error in connection database");
    }


    connection.query("INSERT INTO users SET ?",post,function(err,rows,feilds){
                if(err) {
            throw err;
        }

        console.log("signup successful");
        reply("success");



    });

     connection.release();
    });

   }
});


server.route({
  method: 'GET',
  path  :'/deleteuser',
  handler :  function(request,reply){
      var params = request.query;

      pool.getConnection(function(err,connection){
        if(err) throw err;
        var userid;

        connection.query("select * from users",function(err,rows){
            for(x in rows)
            {
              if(rows[x].ID == params.email)
              {
                userid = rows[x].ID;
                break;
              }
            }
            if(userid)
            {
              pool.getConnection(function(err,connection2){
                if(err) throw err;

               connection2.query("delete from users where ID = ?",userid,function(err,result){
                 if(err) throw err;
                  console.log("user deleted");
                 });

                 connection2.release();
               });
            }
        });
        connection.release();
      });
  }
});

server.route({
    method: 'GET',
    path:'/authenticate',
    handler: function (request, reply) {

      var params = request.query;
      var userid,userpass;
      var flag;
      console.log("ok1");



      pool.getConnection(function(err,connection){
      if (err) {
        reply("Error in connection database");
      }


      connection.query('SELECT * from users', function(err, rows, fields) {
        if (err) throw err;
        console.log("ok2");
        for(x in rows)
        {
          if(rows[x].ID == params.email && rows[x].password == params.pass1)
          { flag=true;
            userid = rows[x].ID;
            userpass = rows[x].password;


          //  var token = jwt.sign(user, app.get('superSecret'), {

          //    });
              break;
           }
         }
         return reply.view('homepage',{idd : userid, passf: userpass});

      });

       connection.release();
     });


  /*    connection.connect();

      connection.query('SELECT * from users', function(err, rows, fields) {
        if (err) throw err;
        console.log("ok2");
        for(x in rows)
        {
          if(rows[x].ID == params.email && rows[x].password == params.pass1)
          { flag=true;
            userid = rows[x].ID;
            userpass = rows[x].password;


          //  var token = jwt.sign(user, app.get('superSecret'), {

          //    });
              break;
           }
         }
         return reply.view('homepage',{idd : userid, passf: userpass});

      //  console.log('The solution is: ', rows[0]);
      //  console.log('The solution is: ', rows[1]);
      });

     connection.end();*/
    }
});

server.register(require('inert'), (err) => {

    if (err) {
        throw err;
    }

    server.route({
    method: 'GET',
    path: '/login',
    handler: function (request, reply) {
        reply.file('form.html');
    }
});

server.route({
    method: 'GET',
    path: '/signupform.html',
    handler: function (request, reply) {
        reply.file('signupform.html');
    }
});

server.route({
    method: 'GET',
    path: '/signin.html',
    handler: function (request, reply) {
        reply.file('signin.html');
    }
});


});

server.views({
  engines:{
    html : require('handlebars')
  },
  relativeTo : __dirname,
  path: 'templates'
});

});

// Start the server
server.start((err) => {

    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});

  });













/*
server.register(require('inert'), (err) => {

    if (err) {
        throw err;
    }

    server.route({
        method: 'GET',
        path: '/login',
        handler: function (request, reply) {
            reply.file('form.html');
        }
    });

    server.route({
        method: 'GET',
        path: '/signupform.html',
        handler: function (request, reply) {
            reply.file('signupform.html');
        }
    });

    server.route({
        method: 'GET',
        path: '/signin.html',
        handler: function (request, reply) {
            reply.file('signin.html');
        }
    });

    server.route({
        method: 'GET',
        path: '/homepage.html',
        handler: function (request, reply) {
            reply.file('homepage.html');
        }
    });

    server.route({
        method: 'GET',
        path: '/newhomepage.html',
        handler: function (request, reply) {
            reply.file('newhomepage.html');
        }
    });




});
*/
