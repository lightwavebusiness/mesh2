(function(ext) {
    // TODO: public repo + documentation + samples
    // GH pages
    
    $.ajax({

        async:false,

        type:'GET',

        url:'https://cdn.firebase.com/js/client/2.2.4/firebase.js',

        data:null,
        
        success: function(){
            fb = new Firebase('https://mle-ict-chat.firebaseio.com');
            //onsole.log('ok');

            fb.child('messages').on('child_added', function(snapshot, preChildKey) {
                let message = snapshot.val()
                window["new-message-"+message.id] = message
                window["new-message-id"] = message.id
            });


            fb.child('room').on('child_added', function(snapshot, prChildKey) {
                let user = snapshot.val()
                let room = { ...window['room'], user }
                window['room'] = room
            })
        }, //Create a firebase reference

        dataType:'script'

    });
    window['temp'] = 0; // init
    
    // Cleanup function when the extension is unloaded
    ext._shutdown = function() {};

    // Status reporting code
    // Use this to report missing hardware, plugin or unsupported browser
    ext._getStatus = function() {
        return {status: 2, msg: 'Ready'};
    };
    
    ext.messageSend = function(message) {
        if(!message || message.length < 0)
            return;

        if(!window['uid'])
        {
            alert("You have not set yourself a name!");
            return;
        }

        let packet = {
            id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            }),
            message: message,
            uuid: window['uid']
        }
        fb.child('messages/' + packet.id).set(packet); //Change value of broadcast so other clients get an update
    }

    ext.messageReceived = function() {
        if(!window["new-message-id"])
            return false
        window["latest-id"] = window["new-message-id"]
        window["new-message-id"] = null;
        return true
    }

    ext.currentMessage = function(callback) {
      //  console.log("Current Received: ", window["latest-id"])
        if(!window["latest-id"])
         return

        let message = window["new-message-"+window["latest-id"]];
        //window["new-message-id"] = null;
        fb.child('users/'+message.uuid).on('value', function(snapshot) {
            var user = snapshot.val();
            callback(user.name+": "+message.message);
        })
        //callback(messageID);
    }

    ext.set_name = function(name) {
        if(!window['uid']) {
            window['uid'] =  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        if(name.length > 0 ){
            let packet = {
                id: window['uid'],
                name: name, 
                dateSet: Date.now() 
            }

            window['user'] = packet


            fb.child('users/'+window['uid']).set(packet)

            fb.child('room/'+window['uid']).set(packet)
        }
    }

    ext.set_icon = function(icon) {
        if(!window['uid']) 
            alert("No name set.")

        if(icon) {
            
        }
    }

    ext.get_my_name = function(callback) {
        if(!window['uid']) 
            return;

        fb.child('users/'+window['uid']).on('value', function(snapshot) {
            var user = snapshot.val();
            callback(user.name);
        })
    }

    function _get_voices() {
        var ret = [];
        var voices = speechSynthesis.getVoices();
        
        for(var i = 0; i < voices.length; i++ ) {
            ret.push(voices[i].name);
            console.log(voices.toString());
        }
        return ret;
    }

    ext.set_voice = function() {
    };

    ext.speak_text = function (text, callback) {
        var u = new SpeechSynthesisUtterance(text.toString());
        u.onend = function(event) {
            if (typeof callback=="function") callback();
        };
        
        speechSynthesis.speak(u);
    };

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            [' ', 'Send Message %s', 'messageSend'],
            [' ', 'Set my name %s', 'set_name'],
            ['R', 'whats my name', 'get_my_name'],
            ['h', 'When new message receieved', 'messageReceived'],
            ['R', 'current message', 'currentMessage'],
            ['', 'set voice to %m.voices', 'set_voice', ''],
            ['w', 'speak %s', 'speak_text', 'Hello!'],
        ],
        menus: {
            voices: _get_voices(),
        },
        url: 'https://github.com/lightwavebusiness/mesh2/blob/master/mesh.js'
    };


    // Register the extension
    ScratchExtensions.register('Mesh2', descriptor, ext);
})({});
