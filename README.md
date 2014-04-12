PseudoSocket
============

Abstracts a Websocket Connection through a relay server


**Set Up**
------------

Run `node index.js` on your webserver (heroku is a good choice)
The server requires express.js to be installed.


**Server**
------------

Initialize a new PseudoSocket server by calling `var pss = new PSServer("ws://yourdomainhere")`.
PSServer is used similarly to WebSockets. Here is an example connection

```javascript
var pss = new PSServer("ws://localhost:5000")

console.log("pss.UID = "+pss.UID);

pss.onConnect = function(PSC) { //PseudoSocketConnection
	console.log(PSC.UID+" connected!")

	PSC.onData = function(data) {
		console.log(PSC.UID+" sent: "+data);
		var msg = data.split(" ");
		if (msg[0] == echo) {
			PSC.send(msg[1]);
		}
	}

	//Note: this function will be called twice. Initially after connecting, and then after requesting a colloquial name
	PSC.onName = function(UID) {
		console.log("My Name is: "+UID); 
	}

	PSC.onClose = function() {
		console.log(PSC.UID+" disconnected!");
		console.log("Remaining Clients ",pss.clients)
	}

}
```

**Client**
------------

The client is also initialized similarly to a WebSocket

```javascript
var psc = new PSClient("ws://localhost:5000","tall-bird") //replace tall-bird with the UID of the server;

psc.onConnect = function() {
	console.log("Connected to "+psc.host)

	psc.send("echo hi!")
}

psc.onData = function(data) {
	console.log("Server sent me "+data)
}
```

-----------

More docs coming soon

