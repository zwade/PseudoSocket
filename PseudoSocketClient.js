PSClient = function(address,hostname) {
	var that = this

	this.host = hostname;
	this.connected = false;
	this.UID = null;
	this.hrt = null;
	this.address = address || "ws://pilotdcrelay.herokuapp.com";
	this.tag = 0;
	this.state = 0;
	this.questions = {};
	this.answers = {};

	this.ws = new WebSocket(this.address);
	this.PSC = new PSCallback(this);

	this.ws.onopen = function(data) {that.PSC.onopen(data)};
	this.ws.onmessage = function(data) {that.PSC.onmessage(data)};
	this.ws.onclose = function(data) {that.PSC.onclose(data)};

	

}

PSClient.prototype.genTag = function() {
	return this.UID+""+this.tag++;
}

PSClient.prototype.startHeartbeat = function() {
	var parent = this;
	this.hrt = setInterval(function() { parent.heartbeat(parent) },20000);
}

PSClient.prototype.stopHeartbeat = function() {
	if (this.hrt) {
		clearInterval(this.hrt);
		this.hrt = null;
	}
}

PSClient.prototype.connectToHost = function(host) {
	host = host || this.host
	if (host) {
		this.ws.send("req "+this.UID+" "+host);
	}
}

PSClient.prototype.heartbeat = function(parent) {
	parent.ws.send("hrt");
}

PSClient.prototype.send = function(data) {
	if (this.state == 1) {
		this.ws.send("tel "+this.host+" "+data);
	}
}

PSClient.prototype.ask = function(question,cb) {
	var tag = this.genTag();
	this.questions[tag] = cb;
	if (this.state == 1) {
		this.ws.send("ask "+tag+" "+this.host+" "+question); 
	}
}

PSClient.prototype.register = function() {
	this.ws.send("reg client");
	this.connectToHost();
}


PSCallback = function(ps) {
	this.ps = ps;
}
PSCallback.prototype.onopen = function(data) {
	this.ps.hasConnected = true;
	this.ps.register();
	this.ps.startHeartbeat();
}
PSCallback.prototype.onmessage = function(data) {
	msg = data.data.split(" ");
	var cmd = msg[0];
	var tag = msg[1];
	var qdest = msg[2];
	var data = ""
	for (var i = 2; i < msg.length-1; i++) {
		data+=msg[i]+" ";
	}
	data += msg[msg.length-1]
	var qdata = ""
	for (var i = 3; i < msg.length-1; i++) {
		qdata+=msg[i]+" ";
	}
	qdata += msg[msg.length-1]
	switch(cmd) {
		case "uid":
			this.ps.UID = data;
			break;
		case "acc":
			if (data == "true") {
				this.ps.state = 1;
				if (this.ps.onOpen) {
					this.ps.onOpen();
				}
			} else {
				this.ps.state = 2;
				if (this.ps.onConnectionFailure) {
					this.ps.onConnectionFailure()
				}
			}
			break
		case "frm":
			if (tag == this.ps.host && this.ps.onData) {
				this.ps.onData(data)
			}
			break
		case "ans":
			if (qdest == this.ps.host && this.ps.questions[tag]) {
				this.ps.questions[tag](qdata);
				delete this.ps.questions[tag];
			}
			break
		case "ask":
			if (this.ps.host == qdest && this.ps.onQuestion) {
				var that = this;
				this.ps.onQuestion(qdata, function(resp) { 
					that.ps.ws.send("ans "+tag+" "+qdest+" "+resp);
				})
			}
			break
	}
}
PSCallback.prototype.onclose = function(data) {
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
}

