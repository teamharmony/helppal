(function() {
	
	
	function loginSuccess(o) {
		var that = this;
		window.bearerToken = o.value;
		window.localStorage.helppal_refresh_token = o.refreshToken.value;
		//store the refreshToken in localStorage
				
		//This function ensures we always have a valid bearer token.
		bearerTimeout = setTimeout(function(){
			clearTimeout(bearerTimeout);
			that.loginWithRefreshToken(window.localStorage.helppal_refresh_token);
		}, o.expiresIn * 1000 - 100);
		
		//clear the timer if not cleared by unloading time.
		window.onbeforeunload = function() {
			clearTimeout(bearerTimeout);
		};
	}

	function defaultErrorhandler(e) {
		console.log("Login Error");
	}
	
	AuthenticationProxy = function(hostUrl,  clientId, loginSuccessCallBack, refreshTokenFailureCallback, passwordFailureCallback) {
		this.hostUrl = hostUrl;
		this.clientId = clientId;
		this.loginSuccessCallBack = loginSuccessCallBack;
		this.refreshTokenFailureCallback = (typeof refreshTokenFailureCallback === "undefined")? defaultErrorhandler: refreshTokenFailureCallback;
		this.passwordFailureCallback = (typeof passwordFailureCallback === "undefined")? defaultErrorhandler: passwordFailureCallback;
	}
	
	AuthenticationProxy.prototype.loginWithPassword = function(username, password) {
		return $.ajax( {
	      	url: this.hostUrl.concat("/oauth/token?grant_type=password&client_id=" + this.clientId + "&username=" + username + "&password=" + password),
	      	async: false,
	      	type: 'GET',
	      	context: this
	 	}).done(loginSuccess).fail(this.passwordFailureCallback).done(this.loginSuccessCallBack);		
	}
	
	AuthenticationProxy.prototype.loginWithRefreshToken = function(refreshToken) {
	    return $.ajax( {
		      	url: this.hostUrl.concat("/oauth/token?grant_type=refresh_token&client_id=" + this.clientId + "&refresh_token=" + refreshToken),
		      	async: false,
		      	type: 'GET',
		      	context: this
		 }).done(loginSuccess).fail(this.refreshTokenFailureCallback).done(this.loginSuccessCallBack);
	}
	
	
})()

