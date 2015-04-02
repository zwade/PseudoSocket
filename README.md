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

pss.onConnect = function(PSC) { //PseudoSocketConnection
	console.log(PSC.UID+" connected!")

	PSC.onData = function(data) {
		console.log(PSC.UID+" sent: "+data);
		var msg = data.split(" ");
		if (msg[0] == "echo") {
			PSC.send(msg[1]);
			return
		}
		if (msg[0] == "verify") {
			PSC.ask("are you sure?", function(data) {
				console.log("Client is sure?: "+data);
			})
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

psc.onQuestion = function(query, callback) {
	if (query == "are you sure?") {
		callback("of course!");
	}
}
```

Methods, Callbacks and Fields
-----------

## PseudoSocketServer
#### Callbacks
Callback | Argument | Use
---------|----------|----
onConnect | PseudoSocketConnection PSC | Called when a PSClient connects to it the first time. Passed a PSC object for that client
onName | String name | Called when the PSS is given a name (Called twice because it is first assigned a raw name, then a colloquial one)
onOpen |  | Called when the PSS connects to the master server
onConnectionFailure |  | Called if the Websocket can't connect to the master server

#### Methods
Method | Argument | Use
-------|----------|-----
broadcast | String message | Broadcasts `message` to all connected PSCs

#### Fields
Field | Use
------|----
clients | Object of all connected clients. Key is UID, value is PSConnection
limit | Total number of clients that may connect. Default is 4.

## PseudoSocketConnection
#### Callbacks
Callback | Argument | Use
---------|----------|----
onQuestion | String question , Function callback | Called when client asks a question. Callback should be called on the answer
onData | String data | Called when client tells the host something. Data is sent as ASCII text
onClose |  | Called when the client disconnects

#### Methods
Method | Argument | Use
-------|----------|----
send | String data | Sends raw text to client
ask | String question , Function callback | Asks the client a question, with `callback` being called on the response

#### Fields
Field | Use
------|----
UID | the unique UID of the client

## PseudoSocketClient
#### Callbacks
Callback | Argument | Use
---------|----------|----
onConnectionFailure |  | Called if either the Websocket can't connect, the desired host does not exist, or the host refused the connection
onOpen |  | Called when the connection to the host is successfully made
onName | String name | Called when the PSC is given a name (UID)
onQuestion | String question , Function callback | Called when host asks a question. Callback should be called on the answer
onData | String data | Called when host tells the client something. Data is sent as ASCII text
onClose | | Called when the host disconnects

#### Methods
Method | Argument | Use
-------|----------|----
send | String data | Sends raw text to host
ask | String question , Function callback | Asks the host a question, with `callback` being called on the response

#### Fields
Field | Use
------|----
UID | the unique UID of the client
host | the UID of the conencted host
state | the state of connection. 0 => not connected, 1 => connected, 2 => connection failed, 3 => disconnected
