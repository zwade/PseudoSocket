PseudoSocket
============

Abstracts a Websocket Connection through a relay server

============

**Set Up**
------------

Run `node index.js` on your webserver (heroku is a good choice)
The server does not require any special libraries, just node built-ins

============

**Server**
------------

Initialize a new PseudoSocket server by calling `var pss = new PSServer("ws://yourdomainhere")`.
PSServer is used similarly to WebSockets. Here is an example connection

```javascript
var pss = new PSServer("ws://localhost:5000")
pss.onConnect = function(PSC) { //PseudoSocketConnection
	console.log(PSC.UID+" connected!")

	PSC.onData = function(data) {
		console.log(PSC.UID+" sent: "+data);
		var msg = data.split(" ");
		if (msg[0] == echo) {
			PSC.send(msg[1]);
		}
	}

	PSC.onClose = function() {
		console.log(PSC.UID+" disconnected!");
	}

}
```



