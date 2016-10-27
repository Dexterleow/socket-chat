var express = require('express')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io').listen(server)
//array to put all the nicknames
// mongoose = require('mongoose'),

app.use(express.static('public'));


users = {};

// rooms which are currently available in chat
var rooms = ['Hollywood','New York','Sci-Fi City','Ancient Egypt','Lost World','Far Far Away','Madagascar'];


server.listen(3000);

//mongoose will automatically create the database
// mongoose.connect('mongodb://localhost/chat', function(err){
//   if(err){
//     console.log(err);
//   } else {
//     console.log('Connected to mongodb!');
//   }
// });

// routing
app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});

//socket io connection
io.sockets.on('connection', function(socket){
  socket.on('new user', function(data,callback){
    //check if someone used this nickname, it will be -1
    if (data in users){
      callback(false);
      //send back boolean
    } else {
      //add to the nickname array
      callback(true);
      socket.nickname = data;
      //
      users[socket.nickname] = socket;
      updateNicknames();

      // //assigning the rooms
      // socket.room = 'Hollywood';
      // // send client to room 1
      // socket.join('Hollywood');

    }
  });

  // socket.on('switchRoom', function(newroom){
  // socket.leave(socket.room);
  // socket.join(newroom);
  // // update socket session room title
  // socket.room = newroom;
// });

  function updateNicknames () {
    io.sockets.emit('usernames', Object.keys(users));
  }


  //use the same name on the client side to send message
  socket.on('send message', function(data, callback){
    //trim message to take care of white space
    var msg = data.trim();
    if(msg.substr(0,3) === '/w '){
      msg = msg.substr(3);
      var ind = msg.indexOf(' ');
      if(ind !== -1){
        var name = msg.substring(0, ind);
        var msg = msg.substring(ind + 1);
        if(name in users){
          users[name].emit('whisper', {msg: msg, nick: socket.nickname});
          console.log('Whisper!');
        } else {
          callback('Error! Enter a valid user.');
        }
      } else {
        callback('Error! Please enter a message for your whisper.');
      }
    } else {
      //send to everyone including me
      //adding socket.nickname to add the name of user when it sends out msg
      io.sockets.emit('new message', {msg: msg, nick: socket.nickname});
    }
  });

    //check if user is typing
  socket.on('typing', function(currentUser){
    io.sockets.emit('isTyping', currentUser)
  });

  socket.on('disconnect', function(data){
    if(!socket.nickname) return;
    //get rid of elements in the array
    delete users[socket.nickname];
    updateNicknames();
  });

});
