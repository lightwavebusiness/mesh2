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
            console.log('ok');
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
    
    ext.broadcast = function(name) {
        if (name.length > 0){ // blank broadcasts break firebase - not nice.
        window['sent-' + name] = Math.random(); // HUGE thanks to the folks at White Mountain Science for fixing the multiple broadcast bug! (lines 32-40)
        fb.child('broadcasts/' + name).set(window['sent-' + name]); //Change value of broadcast so other clients get an update
        }
    };
    
    ext.mesh_hat = function(name) {
        fb.child('broadcasts/' + name).on('value', function(snap){
            window['new-' + name] = snap.val();
            console.log(name);
        }); 
        
        // Make sure broadcasts are unique (don't activate twice)
        if(window['last-' + name] != window['new-' + name] && window['new-' + name] != window['sent-' + name]){
            window['last-' + name] = window['new-' + name];
            return true;
        } else {
            return false;
        }
    }

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

    ext.messageReceived = function(callback) {
        fb.child('messages').on('child_added', function(snapshot, preChildKey) {
            let message = snapshot.val()
            window["new-message"] = message
            return true
        });

        return false
    }

    ext.currentMessage = function(callback) {
        if(!window["new-message"])
         return

        let message = window["new-message"];
        window["new-message"] = null;

        return message
    }

    ext.set_name = function(name) {
        if(!window['uid']) {
            window['uid'] =  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        if(name.length > 0 ){
            fb.child('users/'+window['uid']).set({ name: name, dateSet: Date.now() })
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

    /*function _get_voices() {
        var ret = [];
        var voices = speechSynthesis.getVoices();
        
        for(var i = 0; i < voices.length; i++ ) {
            ret.push(voices[i].name);
            console.log(voices.toString());
        }
        return ret;
    }

    ext.set_voice = function() {
    };*/

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
            ['h', 'when I receive mesh %s', 'mesh_hat'],
            ['R', 'whats my name', 'get_my_name'],
            ['h', 'When new message receieved', 'messageReceived'],
            ['r', 'current message', 'currentMessage'],
            //['', 'set voice to %m.voices', 'set_voice', ''],
            ['w', 'speak %s', 'speak_text', 'Hello!'],
        ],
        /*menus: {
            voices: _get_voices(),
        },*/
        url: 'https://github.com/lightwavebusiness/mesh2/blob/master/mesh.js'
    };


    // Register the extension
    ScratchExtensions.register('Mesh2', descriptor, ext);
})({});
