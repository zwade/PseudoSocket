
PSServer = function(address) {
	var that = this

	this.UID = null;
	this.hrt = null;
	this.address = address || "ws://localhost:5000";
	this.tag = 0;
	this.state = 0;
	this.questions = {};
	this.answers = {};
	this.clients = {};
	
	this.onConnect = null;
	this.onConnectionFailure = null;
	this.onOpen = null;
	this.onName = null;

	this.ws = new WebSocket(this.address);
	this.PSC = new PSCallback(this);

	this.ws.onopen = function(data) {that.PSC.onopen(data)};
	this.ws.onmessage = function(data) {that.PSC.onmessage(data)};
	this.ws.onclose = function(data) {that.PSC.onclose(data)};

	

}

PSServer.prototype.genTag = function() {
	return this.tag++;
}

PSServer.prototype.startHeartbeat = function() {
	var parent = this;
	this.hrt = setInterval(function() {parent.heartbeat(parent)},20000);
}

PSServer.prototype.stopHeartbeat = function() {
	if (this.hrt) {
		clearInterval(this.hrt);
		this.hrt = null;
	}
}


PSServer.prototype.heartbeat = function(parent) {
	parent.ws.send("hrt");
}

PSServer.prototype.register = function() {
	this.ws.send("reg host");
	this.ws.send("nam "+this.UID);
}


PSCallback = function(ps) {
	this.ps = ps;
}
PSCallback.prototype.onopen = function(data) {
	this.ps.hasConnected = true;
	this.ps.register();
	this.ps.startHeartbeat();
	if (this.ps.onOpen) {
		this.ps.onOpen();
	}
}
PSCallback.prototype.onmessage = function(data) {
	msg = data.data.split(" ");
	var cmd = msg[0];
	var tag = msg[1];
	var data = ""
	for (var i = 2; i < msg.length-1; i++) {
		data+=msg[i]+" ";
	}
	data += msg[msg.length-1]
	switch(cmd) {
		case "uid":
			this.ps.UID = data;
			if (this.ps.onName) {
				this.ps.onName(data);
			}
			break;
		case "req":
			if (Object.keys(this.ps.clients).length < 4) {
				this.ps.clients[tag] = new PSC(tag,this.ps);
				this.ps.ws.send("acc "+tag+" true");
				if (this.ps.onConnect) {
					this.ps.onConnect(this.ps.clients[tag]);
				}

			} else {
				this.ps.ws.send("acc "+tag+" false");
			}
			break
		case "brk":
			if (this.ps.clients[tag]) {
				if (this.ps.clients[tag].onClose) {
					this.ps.clients[tag].onClose();
				}
				delete this.ps.clients[tag]
			}
			break
		case "frm":
			if (this.ps.clients[tag] && this.ps.clients[tag].onData) {
				this.ps.clients[tag].onData(data);
			}
			break
	}
}
PSCallback.prototype.onclose = function(data) {
	this.ps.clients = {};
	this.ps.stopHeartbeat();
	if (!this.ps.hasConnected) {
		if (this.ps.onConnectionFailure) {
			this.ps.onConnectionFailure();
		}
	} else {
		if (this.ps.onClose) {
			this.ps.state = 3;
			this.ps.onClose();
		}
	}
	for (i in this.ps.clients) {
		if (this.ps.clients[i].onClose) {
			this.ps.clients[i].onClose();
		}
	}
}

PSC = function(UID,pss) {
	this.UID = UID;
	this._ps = pss;
}

PSC.prototype.send = function(text) {
	if (this.UID && this._ps && this._ps.clients[this.UID]) {
		this._ps.ws.send("tel "+this.UID+" "+text)
	}
}
