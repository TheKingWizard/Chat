var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var nicknames = require('./nicknames');

var users = [];
var log = [];



app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    console.log('A user connected.');

    let nickname = null;

    socket.on('log request', function(){
        socket.emit('log response', log);
    });

    socket.on('name request', function(){
        console.log('User has requested a nickname.');
        socket.emit('name response', nicknames.getNickname());
    });

    socket.on('hello', function(name){
        nickname = name;
        console.log(nickname + ' has joined the chat.')
        let serverMsg = serverMessage(nickname + ' has joined the chat.');
        log.push(serverMsg);
        io.emit('chat message', serverMsg);
        users.push(nickname);
        io.emit('users', users);
    });

    socket.on('color request', function(){
        let color = "";
        let hex = ['0', '1', '2', '3', '4', '5', '6', '7',
                   '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
        for(let i = 0; i < 6; i++){
            color += hex[Math.floor(Math.random() * hex.length)];
        }
        socket.emit('color change', color);
    });

    socket.on('chat message', function(msg){
        console.log(msg);
        msg.time = new Date();
        if(msg.message.charAt(0) === '/'){
            console.log('command received');
            let args = msg.message.split(' ');
            if(args[0] === '/nick') {
                console.log('nickname command');
                oldNickname = nickname;
                removeUser(oldNickname);
                nickname = args.slice(1).join(' ');
                socket.emit('name change', nickname);
                let serverMsg = serverMessage(oldNickname + ' is now ' + nickname);
                log.push(serverMsg);
                io.emit('chat message', serverMsg);
                users.push(nickname);
                io.emit('users', users);
            } else if(args[0] === '/nickcolor') {
                let regex = new RegExp('^([a-fA-F0-9]{6})$')
                if(regex.test(args[1])) {
                    socket.emit('color change', args[1]);
                } else {
                    socket.emit('chat message', serverMessage('Invalid color input. Please provide the new color in the format RRGGBB.'));
                }
            } else if(args[0] === '/?'){
                socket.emit('chat message', serverMessage('Change nickname: /nick <new nickname>'));
                socket.emit('chat message', serverMessage('Change nickname color: /nickcolor <RRGGBB>'));
            } else {
                console.log('invalid command');
                socket.emit('chat message', serverMessage(args[0] + ' is not a recognized command. Use /? to see available commands.'));
            }
        } else {
            console.log('message: ' + msg);
            log.push(msg);
            io.emit('chat message', msg);
        }
    });

    socket.on('disconnect', function(){
        console.log(nickname + ' has disconnected.');
        removeUser(nickname);
        let serverMsg = serverMessage(nickname + ' has left the chat.');
        log.push(serverMsg);
        io.emit('chat message', serverMsg);
        io.emit('users', users);
    });
});



http.listen(3000, function(){
    console.log('listening on *:3000');
});

function removeUser(user){
    for (let i = users.length - 1; i >= 0; i--) {
        if (users[i] === user) {
            users.splice(i, 1);
            break;
        }
    }
}

function serverMessage(message){
    let msg = new Object();
    msg.time = new Date();
    msg.user = 'SERVER';
    msg.nickname = 'Server';
    msg.color = 'FFFFFF';
    msg.message = message;

    return msg;
}