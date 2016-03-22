  var OAUTHURL    =   'https://accounts.google.com/o/oauth2/auth?';
        var VALIDURL    =   'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=';
        var SCOPE       =   'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/userinfo.email';
        var CLIENTID    =   CLIENTID;
        var REDIRECT    =   REDIRECT;
        var LOGOUT      =   'http://accounts.google.com/Logout';
        var TYPE        =   'token';
        var _url        =   OAUTHURL + 'scope=' + SCOPE + '&client_id=' + CLIENTID + '&redirect_uri=' + REDIRECT + '&response_type=' + TYPE;
        var acToken;
        var tokenType;
        var expiresIn;
        var user;
        var loggedIn    =   false;

        function glogin() {            
            var win = window.open(_url, "windowname1", 'width=800, height=600'); 
            var pollTimer   =   window.setInterval(function() { 
                try {
                    console.log(win.document.URL);
                    if (win.document.URL.indexOf(REDIRECT) != -1) {
                        window.clearInterval(pollTimer);
                        var url =   win.document.URL;
                        acToken =   gup(url, 'access_token');
                        tokenType = gup(url, 'token_type');
                        expiresIn = gup(url, 'expires_in');
                        win.close();

                        validateToken(acToken);
                    }
                } catch(e) {
                }
            }, 500);
        }

        function validateToken(token) {
            $.ajax({
                url: VALIDURL + token,
                data: null,
                success: function(responseText){
                    
                    getUserInfogoogle();
                    loggedIn = true;
                    
//                    $('#loginText').hide();
//                    $('#logoutText').show();
                },  
                dataType: "jsonp"  
            });
        }

        function getUserInfogoogle() {
           
            $.ajax({
                url: 'https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + acToken,
                data: null,
                success: function(resp) {
                    
                    user    =   resp;
                    
                    url_google=google_login_url+ user.name+'/'+user.email;
                   getgpluslatlon();
                    //window.location.href=url_google;

                },
                dataType: "jsonp"
            });
        }

        //credits: http://www.netlobo.com/url_query_string_javascript.html
        function gup(url, name) {
            name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
            var regexS = "[\\#&]"+name+"=([^&#]*)";
            var regex = new RegExp( regexS );
            var results = regex.exec( url );
            if( results == null )
                return "";
            else
                return results[1];
        }

        function startLogoutPolling() {
            $('#loginText').show();
            $('#logoutText').hide();
            loggedIn = false;
            $('#uName').text('Welcome ');
            $('#imgHolder').attr('src', 'none.jpg');
        }
        
        
        
function getgpluslatlon(){
    if(navigator.geolocation)
    {
        navigator.geolocation.getCurrentPosition(showUserlatlng_g_plus);
    }
      
}
 
function showUserlatlng_g_plus(position) {
  var lat = position.coords.latitude;
  var lon = position.coords.longitude;
  var email = user.email;
  //alert(user.email);
  
         $.ajax({
          type: 'POST',
          url: AbsoluteUrl+"index/getuserlatlong_google",
          data: {lat:lat,lon:lon,email:email},
          callback:false,
          success: function(result) {
            //alert(result);
                  if(result=='fail')
                  {
                  //alert("seession");
                  
                  }
                window.location.href=url_google;
           },
           error: function (result) {}
      });
}
