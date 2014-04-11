var WebSocketServer = require('ws').Server
	, http = require('http')
	, express = require('express')
	, app = express()
	, port = process.env.PORT || 5000;
var words = require("./words")

app.use(express.static(__dirname + '/'));

var server = http.createServer(app);
server.listen(port);
console.log('http server listening on %d', port);
var wss = new WebSocketServer({server: server});
console.log('websocket server created');

var conns = {}

var hosts = {};
var clients = {};

var genUID = function() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

	for( var i=0; i < 8; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;	
}
var genName = function() {
	var adj = words.adj[Math.floor(Math.random()*(words.adj.length-1))]
	var noun = words.noun[Math.floor(Math.random()*(words.noun.length-1))]
	return adj+"-"+noun
}

wss.on('connection', function(ws) {

	console.log('websocket connection open');
	if (!ws.UID) {
		var uid = genUID();
		ws.UID = uid;
		conns[uid] = ws;
		ws.send("uid set "+uid);
	}

	ws.on('message', function(data) {
		handleMessage(ws,data);
	})
	


	ws.on('close', function() {
		console.log('websocket connection close');
		delete conns[ws.UID]
		if (ws.host && hosts[ws.host]) {
			hosts[ws.host].send("brk "+ws.UID);
		}
		if (ws.isHost===true) {
			delete hosts[ws.UID];
		} else if (ws.isHost===false) {
			delete clients[ws.UID];
		}
	});
});

var handleMessage = function(ws, data) {
	data = data.toString();
	var msg = data.split(" ");
	var cmd = msg[0];
	var tag = msg[1];

	var  dat = "";
	for (i = 2; i < msg.length-1; i++) {
		dat += msg[i]+" "
	}
	dat += msg[msg.length-1];
	if (cmd != "hrt") {
		console.log("Received: "+data+" from: "+ws.UID);
	}
	
	switch (cmd) {
		case "hrt":
			console.log("received heartbeat from "+ws.UID);
			break
		case "reg":
			if (dat == "host") {
				ws.isHost = true;
				ws.clients = [];
				ws.send("inf "+tag+" 101")
				hosts[ws.UID] = ws;
				break
			} else if (dat == "client") {
				ws.isHost = false;
				ws.host = null;
				ws.send("inf "+tag+" 101")
				clients[ws.UID] = ws;
				break
			} else {
				ws.send("inf "+tag+" 200");
				break
			}
		case "nam":
			var name = genName();
			while (true) {
				if (!conns[name]) {
					break;
				}
				name = genName();
			}
			delete conns[ws.UID];
			conns[name] = ws;
			if (hosts[ws.UID]) {
				delete hosts[ws.UID];
				hosts[name] = ws
			} else if (clients[ws.UID]) {
				delete clients[ws.UID];
				hosts[name] = ws;
			}
			ws.UID = name;
			ws.send("uid set "+ws.UID)
			break;
			
		case "req":
			if (hosts[dat]) {
				hosts[dat].send("req "+ws.UID+" "+dat);
			} else {
				ws.send("acc "+tag+" false")
			}
			break
		case "acc":
			if (dat == "true") {
				console.log(tag)
				if (clients[tag]) {
					hosts[ws.UID].clients.push(clients[tag])
					clients[tag].send("acc "+tag+" true");
					clients[tag].host = ws.UID;
				}
			} else {
				clients[tag].send("acc "+tag+" false");
			}
			break;
		case "tel":
			if (conns[tag]) {
				conns[tag].send("frm "+ws.UID+" "+dat)
				ws.send("inf log 101")
			} else {
				ws.send("inf err 201")
			}
			break
		case "prt":
			if (! tag) {
				console.log("Conns:")
				for (i in conns) {
					console.log("    "+i);
				}
			} else {
				console.log(tag+" "+dat);
			}
			ws.send("inf log 101")
			break
		case "ech":
			ws.send("ech "+tag)
			

	}
}
