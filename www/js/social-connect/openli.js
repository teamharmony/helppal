/**
 * @version 0.4
 */
var openLI = (function () {

    var LI_LOGIN_URL = 'https://www.linkedin.com/uas/oauth2/authorization',
            // By default we store litoken in sessionStorage. This can be overridden in init()
            tokenStore = window.localStorage,
            liAppId,
            oauthRedirectURL = 'http://www.logicupsolutions.com/linkedin/jsTest/oauthcallback.html',
            loginCallback,
            // Indicates if the app is running inside Cordova
            runningInCordova,
            // Used in the exit event handler to identify if the login has already been processed elsewhere (in the oauthCallback function)
            loginProcessed;

    document.addEventListener("deviceready", function () {
        runningInCordova = true;
    }, false);

    function init(params) {
        if (params.appId) {
            liAppId = params.appId;
        } else {
            throw 'appId parameter not set in init()';
        }

        if (params.tokenStore) {
            tokenStore = params.tokenStore;
        }
    }

    function getLoginStatus(callback) {
        var token = tokenStore['litoken'],
                loginStatus = {};
        if (token) {
            loginStatus.status = 'connected';
            loginStatus.authResponse = {token: token};
        } else {
            loginStatus.status = 'unknown';
        }
        if (callback)
            callback(loginStatus);
    }

    function login(callback, options) {

        var loginWindow,
                startTime,
                scope = '';
        if (!liAppId) {
            return callback({status: 'unknown', error: 'LinkedIn App Id not set.'});
        }

// Inappbrowser load start handler: Used when running in Cordova only
        function loginWindow_loadStartHandler(event) {
            var url = event.url;
            if (url.indexOf("code=") > 0 || url.indexOf("error=") > 0) {
                var timeout = 600 - (new Date().getTime() - startTime);
                setTimeout(function () {
                    loginWindow.close();
                }, timeout > 0 ? timeout : 0);
                oauthCallback(url);
            }
        }

// Inappbrowser exit handler: Used when running in Cordova only
        function loginWindow_exitHandler() {
            console.log('exit and remove listeners');
            deferredLogin.reject({error: 'user_cancelled', error_description: 'User cancelled login process', error_reason: "user_cancelled"});
            loginWindow.removeEventListener('loadstop', loginWindow_loadStartHandler);
            loginWindow.removeEventListener('exit', loginWindow_exitHandler);
            loginWindow = null;
            console.log('done removing listeners');
        }

        if (options && options.scope) {
            scope = options.scope;
        }

        loginCallback = callback;
        loginProcessed = false;

        startTime = new Date().getTime();
        console.log(LI_LOGIN_URL + '?client_id=' + liAppId + '&state=5495213e76b7f7.34173529&redirect_uri=' + oauthRedirectURL + '&response_type=code&scope=' + scope);
        loginWindow = window.open(LI_LOGIN_URL + '?client_id=' + liAppId + '&state=5495213e76b7f7.34173529&redirect_uri=' + oauthRedirectURL +
                '&response_type=code&scope=' + scope, '_blank', 'location=no');
        // If the app is running in Cordova, listen to URL changes in the InAppBrowser until we get a URL with an access_token or an error
        if (runningInCordova) {
            loginWindow.addEventListener('loadstart', loginWindow_loadStartHandler);
            loginWindow.addEventListener('exit', loginWindow_exitHandler);
        }

    }

    function oauthCallback(url) {
        var qs = getQueryStrings(url);
        loginProcessed = true;
        if (url.indexOf("code=") > 0) {
            var licode = qs['code'];
            tokenStore['litoken'] = getAccessToken(licode);
            if (loginCallback)
                loginCallback({status: 'connected', authResponse: {token: tokenStore['litoken']}});
        } else if (url.indexOf("error=") > 0) {
            if (loginCallback)
                loginCallback({status: 'not_authorized', error: qs['error']});
        } else {
            if (loginCallback)
                loginCallback({status: 'not_authorized'});
        }
    }

    function getProfileInfo(callback)
    {
        var token = tokenStore['litoken'];
        var url = 'https://api.linkedin.com/v1/people/~:(id,first-name,last-name,headline,picture-url,formatted-name,email-address,phone-numbers,location:(country:(code)))?format=json&oauth2_access_token=' + token;

        var profileInfo = "{message: 'An error has occurred'}";
        $.ajax({
            url: url,
            type: "GET",
            async: false,
            success: function (data) {
                console.log(JSON.stringify(data));
                profileInfo = data;
            },
            onerror: function (xhr, ajaxOptions, thrownError) {
                var error = xhr.responseText ? JSON.parse(xhr.responseText).error : {message: 'An error has occurred'};
                console.log(error);
            }
        });
        if (callback)
            callback(profileInfo);
    }

    function logout(callback) {
        var token = tokenStore['litoken'],
                logoutStatus = {};
        if (token) {
            tokenStore.removeItem('litoken');
            logoutStatus.status = 'success';
        }
        else
        {
            logoutStatus.status = 'Already Logout';
        }
        if (callback)
            callback(logoutStatus);
    }

    function getAccessToken(code) {
        var url = 'https://www.linkedin.com/uas/oauth2/accessToken?grant_type=authorization_code&redirect_uri=http://www.logicupsolutions.com/linkedin/jsTest/oauthcallback.html&client_id=75t0xejjk3bvmx&client_secret=EsTu751SIdV2Z0sn&code=' + code;

        var access_token = "no-token";
        $.ajax({
            url: url,
            type: "GET",
            async: false,
            success: function (data) {
                console.log(JSON.stringify(data));
                access_token = data.access_token;
            },
            onerror: function (xhr, ajaxOptions, thrownError) {
                var error = xhr.responseText ? JSON.parse(xhr.responseText).error : {message: 'An error has occurred'};
                console.log(error);
            }
        });
        return access_token;
    }

    function getQueryStrings(url) {
        var assoc = {};
        var decode = function (s) {
            return decodeURIComponent(s.replace(/\+/g, " "));
        };
        var n = url.indexOf("?");
        var queryString = url.substring(n + 1);
        var keyValues = queryString.split('&');
        for (var i in keyValues) {
            var key = keyValues[i].split('=');
            if (key.length > 1) {
                assoc[decode(key[0])] = decode(key[1]);
            }
        }
        return assoc;
    }

// The public API
    return {
        init: init,
        login: login,
        logout: logout,
        oauthCallback: oauthCallback,
        getQueryStrings: getQueryStrings,
        getProfileInfo: getProfileInfo,
        getLoginStatus: getLoginStatus
    };
}());