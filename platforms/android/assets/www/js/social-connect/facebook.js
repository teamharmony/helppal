
window.fbAsyncInit = function() {
	FB.init({
		appId		: '1442578949379728',
		channelUrl	: 'http://localhost:8081/meetmepal/channel.html', // Channel File
		status		: true,
		xfbml		: true,
		cookie		: true,
		version		: 'v2.3'
	});
};
	
(function(d, s, id){
	var js, fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id)) {return;}
	js = d.createElement(s); js.id = id;
	js.src = "//connect.facebook.net/en_US/sdk.js";
	fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

var fb = {
	login: function(){
		//$.mobile.navigate('#page-home');
		FB.login(function(response) {
			if(response.status === 'connected') {
				$.mobile.navigate('#page-home');
			} else {
				//alert('Facebook login failed: ' + response.error);
			}
		},{scope: 'email,user_photos'});
	}
};