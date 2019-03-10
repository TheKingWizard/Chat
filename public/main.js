$(function () {
    var socket = io();

    function addMessage(msg){
        let t = new Date(msg.time);
        let h = t.getHours();
        let m = t.getMinutes();
        let s = t.getSeconds();
        let timeStr = h + ':' + m + ':' + s;

        let time = $('<span>').text(timeStr + ' ');
        let name = $('<span>').text(msg.nickname + ': ');
        name.attr('style', 'color:#' + msg.color + ';');
        let message = $('<span>').text(msg.message);
        let chatItem = $('<li>').append(time).append(name).append(message);
            
        if(msg.user === user)
            chatItem.attr('style', 'font-weight:bold;')
        else if(msg.user === "SERVER")
            chatItem.attr('style', 'font-style:italic;')

        $('#messages').append(chatItem);
        $('#messages-wrapper').animate({scrollTop: $("#messages-wrapper").prop("scrollHeight")}, 0);
    }

    var user = getCookie('user');
    if(user === null){
        console.log('No user cookie, creating a new id.');
        let array = new Uint32Array(2);
        window.crypto.getRandomValues(array);
        user = array.join("");
        document.cookie = 'user=' + user;
    }

    socket.emit('log request');

    socket.on('log response', function(log){
        for(let i = 0; i < log.length; i++){
            addMessage(log[i]);
        }
    });

    var nickname = getCookie('nickname');
    if(nickname === null){
        console.log('No nickname cookie, requesting a name from server.');
        socket.emit('name request');
    } else {
        console.log('Nickname cookie found: ' + nickname);
        socket.emit('hello', nickname);
        $('#nickname').text(nickname);
    }

    var color = getCookie('color');
    if(color === null){
        console.log('No nickname color cookie, requesting a color from server.')
        socket.emit('color request');
    }

    socket.on('name response', function(nickname){
        console.log('Server has given nickname: ' + nickname);
        document.cookie = 'nickname=' + nickname;
        socket.emit('hello', nickname);
        $('#nickname').text(nickname);
    });

    socket.on('name change', function(name){
        nickname = name;
        document.cookie = 'nickname=' + nickname;
        $('#nickname').text(nickname);
        $('#messages').append($('<li>').append($('<i>').text('Name changed to: ' + nickname)));
    });

    socket.on('color change', function(newColor){
        color = newColor;
        document.cookie = 'color=' + color;
        console.log('Server has given color: ' + color);
        $('#messages').append($('<li>').append($('<i>').text('Color changed to: ' + color)));
    });

    socket.on('users', function(users){
        console.log('User list updated.');
        $('#users').empty();
        for(let i = 0; i < users.length; i++){
            $('#users').append($('<li>').text(users[i]));
        }
    });

    $('form').submit(function(e){
        e.preventDefault(); // prevents page reloading
        let msg = new Object();
        msg.user = user;
        msg.nickname = nickname;
        msg.color = color;
        msg.message = $('#m').val();
        console.log(msg);
        socket.emit('chat message', msg);
        //socket.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });

    socket.on('chat message', function(msg){
        addMessage(msg);
        //$('#messages').append($('<li>').text(timeStr + ' ' + msg.nickname + ': ' + msg.message));
    });

    socket.on('server message', function(msg){
        $('#messages').append($('<li>').append($('<i>').text(msg)));
    });
});

function getCookie(cname){
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
}