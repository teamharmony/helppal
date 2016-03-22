/**
 * OpenTT is a micro-library that lets you integrate your JavaScript application with Twitter.
 * OpenTT works for both BROWSER-BASED apps and CORDOVA/PHONEGAP apps.
 * This library has no dependency: You don't need (and shouldn't use) the Twitter SDK with this library. Whe running in
 * Cordova, you also don't need the Twitter Cordova plugin. There is also no dependency on jQuery.
 * OpenTT allows you to login to Twitter and execute any Twitter Graph API request.
 * @author Christophe Coenraets @ccoenraets
 * @version 0.4
 */
var openTT = (function () {

    var TT_LOGIN_URL = 'http://www.logicupsolutions.com/twitter/login.php',
            TT_LOGOUT_URL = 'http://www.logicupsolutions.com/twitter/logout.php',
            // By default we store tttoken in sessionStorage. This can be overridden in init()
            tokenStore = window.sessionStorage,
            ttAppId,
            baseURL = "http://localhost:8081/instameet/www",
            oauthRedirectURL = baseURL + '/oauthcallback.html',
            logoutRedirectURL = baseURL + '/logoutcallback.html',
            // Because the OAuth login spans multiple processes, we need to keep the login callback function as a variable
            // inside the module instead of keeping it local within the login function.
            loginCallback,
            // Indicates if the app is running inside Cordova
            runningInCordova,
            // Used in the exit event handler to identify if the login has already been processed elsewhere (in the oauthCallback function)
            loginProcessed;

    console.log(oauthRedirectURL);
    console.log(logoutRedirectURL);

    document.addEventListener("deviceready", function () {
        runningInCordova = true;
    }, false);

    /**
     * Initialize the OpenTT module. You must use this function and initialize the module with an appId before you can
     * use any other function.
     * @param params - init paramters
     *  appId: The id of the Twitter app,
     *  tokenStore: The store used to save the Twitter token. Optional. If not provided, we use sessionStorage.
     */
    function init(params) {
        if (params.appId) {
            ttAppId = params.appId;
        } else {
            throw 'appId parameter not set in init()';
        }

        if (params.tokenStore) {
            tokenStore = params.tokenStore;
        }
    }

    /**
     * Checks if the user has logged in with openTT and currently has a session api token.
     * @param callback the function that receives the loginstatus
     */
    function getLoginStatus(callback) {
        var token = tokenStore['tttoken'],
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

    /**
     * Login to Twitter using OAuth. If running in a Browser, the OAuth workflow happens in a a popup window.
     * If running in Cordova container, it happens using the In-App Browser. Don't forget to install the In-App Browser
     * plugin in your Cordova project: cordova plugins add org.apache.cordova.inappbrowser.
     *
     * @param callback - Callback function to invoke when the login process succeeds
     * @param options - options.scope: The set of Twitter permissions requested
     * @returns {*}
     */
    function login(callback, options) {

        var loginWindow,
                startTime,
                scope = '';

        if (!ttAppId) {
            return callback({status: 'unknown', error: 'Twitter App Id not set.'});
        }

        // Inappbrowser load start handler: Used when running in Cordova only
        function loginWindow_loadStartHandler(event) {
            var url = event.url;
            if (url.indexOf("loginstatus=") > 0 || url.indexOf("error=") > 0) {
                // When we get the access token fast, the login window (inappbrowser) is still opening with animation
                // in the Cordova app, and trying to close it while it's animating generates an exception. Wait a little...
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
            // Handle the situation where the user closes the login window manually before completing the login process
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

//        logout();

        if (runningInCordova) {
//            oauthRedirectURL = "https://www.twitter.com/connect/login_success.html";
        }
        console.log(TT_LOGIN_URL, '_blank', 'location=no');
        startTime = new Date().getTime();
        loginWindow = window.open(TT_LOGIN_URL, '_blank', 'location=no');

        // If the app is running in Cordova, listen to URL changes in the InAppBrowser until we get a URL with an access_token or an error
        if (runningInCordova) {
            loginWindow.addEventListener('loadstart', loginWindow_loadStartHandler);
            loginWindow.addEventListener('exit', loginWindow_exitHandler);
        }
        // Note: if the app is running in the browser the loginWindow dialog will call back by invoking the
        // oauthCallback() function. See oauthcallback.html for details.

    }

    /**
     * Called either by oauthcallback.html (when the app is running the browser) or by the loginWindow loadstart event
     * handler defined in the login() function (when the app is running in the Cordova/PhoneGap container).
     * @param url - The oautchRedictURL called by Twitter with the access_token in the querystring at the ned of the
     * OAuth workflow.
     */
    function oauthCallback(url) {
        // Parse the OAuth data received from Twitter
        var queryString,
                obj;

        loginProcessed = true;
        if (url.indexOf("loginstatus=") > 0) {
            queryString = url.substr(url.indexOf('#') + 1);
            obj = parseQueryString(queryString);
            tokenStore['tttoken'] = obj['loginstatus'];
            if (loginCallback)
                loginCallback({status: 'connected', authResponse: {token: obj['loginstatus']}});
        } else if (url.indexOf("error=") > 0) {
            queryString = url.substring(url.indexOf('?') + 1, url.indexOf('#'));
            obj = parseQueryString(queryString);
            if (loginCallback)
                loginCallback({status: 'not_authorized', error: obj.error});
        } else {
            if (loginCallback)
                loginCallback({status: 'not_authorized'});
        }
    }

    /**
     * Logout from Twitter, and remove the token.
     * IMPORTANT: For the Twitter logout to work, the logoutRedirectURL must be on the domain specified in "Site URL" in your Twitter App Settings
     *
     */
    function logout(callback) {
        var logoutWindow,
                token = tokenStore['tttoken'];

        var logoutStatus = {};
        if (token) {
            tokenStore.removeItem('tttoken');
            logoutStatus.status = 'success';

            logoutWindow = window.open(TT_LOGOUT_URL, '_blank', 'location=no');
            if (runningInCordova) {
                setTimeout(function () {
                    logoutWindow.close();
                    if (callback) {
                        callback();
                    }
                }, 2000);
            }
        }
        else
        {
            logoutStatus.status = 'Already Logout';
        }
    }

    /**
     * Lets you make any Twitter Graph API request.
     * @param obj - Request configuration object. Can include:
     *  method:  HTTP method: GET, POST, etc. Optional - Default is 'GET'
     *  path:    path in the Twitter graph: /me, /me.friends, etc. - Required
     *  params:  queryString parameters as a map - Optional
     *  success: callback function when operation succeeds - Optional
     *  error:   callback function when operation fails - Optional
     */
    function api(obj) {

        var method = obj.method || 'GET',
                xhr = new XMLHttpRequest(),
                url;

        url = 'http://www.logicupsolutions.com/twitter/index.php';

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (obj.success)
                        obj.success(JSON.parse(xhr.responseText));
                } else {
                    var error = xhr.responseText ? JSON.parse(xhr.responseText).error : {message: 'An error has occurred'};
                    if (obj.error)
                        obj.error(error);
                }
            }
        };

        xhr.open(method, url, true);
        xhr.send();
    }

    function parseQueryString(queryString) {
        var qs = decodeURIComponent(queryString),
                obj = {},
                params = qs.split('&');
        params.forEach(function (param) {
            var splitter = param.split('=');
            obj[splitter[0]] = splitter[1];
        });
        return obj;
    }

    function toQueryString(obj) {
        var parts = [];
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
            }
        }
        return parts.join("&");
    }

    // The public API
    return {
        init: init,
        login: login,
        logout: logout,
        api: api,
        oauthCallback: oauthCallback,
        getLoginStatus: getLoginStatus
    };

}());