function doLogout()
{
    var soc = localStorage.social;
    console.log("Social : " + soc);
    if (soc === "google")
    {
        glLogout();
    }
    else if (soc === "facebook")
    {
        fbLogout();
    }
    else if (soc === "linkedin")
    {
        liLogout();
    }
    else if (soc === "twitter")
    {
        ttLogout();
    }
}

//LINKEDIN Functions
openLI.init({appId: '75t0xejjk3bvmx'});
function liLogin() {
    openLI.getLoginStatus(
            function (response) {
                console.log(JSON.stringify(response));
                if (response.status === "connected")
                {
                    alert("Already Login");
                    window.location = "profile.html";
                }
                else
                {
                    openLI.login(
                            function (response) {
                                console.log(JSON.stringify(response));
                                if (response.status === 'connected') {
                                    liGetProfileInfo();
                                } else {
                                    alert('LinkedIn login failed: ' + response.error);
                                }
                            }, {scope: 'r_basicprofile+r_emailaddress'});
                }
            });
}

function liGetProfileInfo()
{
    openLI.getProfileInfo(
            function (response) {
                console.log(JSON.stringify(response));
                alert("Welcome, " + response.formattedName + " !");
                localStorage.social = "linkedin";
                window.location = "profile.html";
            });
}

function liLogout()
{
    openLI.logout(
            function (response) {
                console.log(JSON.stringify(response));
                alert('Logout successful');
                window.location = "index.html";
            });
}

//FACEBOOK Functions
openFB.init({appId: '210379902502481'});
function fbLogin() {
    openFB.getLoginStatus(
            function (response) {
                console.log(JSON.stringify(response));
                if (response.status === "connected")
                {
                    alert("Already Login");
                    window.location = "profile.html";
                }
                else
                {
                    openFB.login(
                            function (response) {
                                if (response.status === 'connected') {
                                    fbGetInfo();
                                } else {
                                    alert('Facebook login failed: ' + response.error);
                                }
                            }, {scope: 'email,read_stream,publish_stream'});
                }
            });
}
function fbGetInfo() {
    openFB.api({
        path: '/me',
        success: function (data) {
            console.log(JSON.stringify(data));
            alert("Welcome, " + data.name + " !");
            localStorage.social = "facebook";
            window.location = "profile.html";
        },
        error: function (error) {
            alert(error.message);
        }
    });
}
function fbLogout() {
    openFB.logout(
            function () {
                alert('Logout successful');
                window.location = "index.html";
            },
            function (error) {
                alert(error.message);
            });
}

//GOOGLE Functions
openGL.init({appId: '527237604208-q8ed7s7oiu1mj5vpm5rgaj99j5522phs.apps.googleusercontent.com'});
function glLogin() {
    openGL.getLoginStatus(
            function (response) {
                console.log(JSON.stringify(response));
                if (response.status === "connected")
                {
                    alert("Already Login");
                    window.location = "profile.html";
                }
                else
                {
                    openGL.login(
                            function (response) {
                                if (response.status === 'connected') {
                                    glGetInfo();
                                } else {
                                    alert('Google login failed: ' + response.error);
                                }
                            }, {scope: 'openid profile email'});
                }
            });
}
function glGetInfo() {
    openGL.api({
        path: '/userinfo',
        success: function (data) {
            console.log(JSON.stringify(data));
            alert("Welcome, " + data.name + " !");
            localStorage.social = "google";
            window.location = "profile.html";
        },
        error: function (error) {
            alert(error.message);
        }
    });
}
function glLogout() {
    openGL.logout(
            function () {
                alert('Logout successful');
                window.location = "index.html";
            },
            function (error) {
                alert(error.message);
            });
}

//TWITTER Functions
openTT.init({appId: 'null'});
function ttLogin() {
    openTT.getLoginStatus(
            function (response) {
                console.log(JSON.stringify(response));
                if (response.status === "connected")
                {
                    alert("Already Login");
                    window.location = "profile.html";
                }
                else
                {
                    openTT.login(
                            function (response) {
                                if (response.status === 'connected') {
                                    ttGetInfo();
                                } else {
                                    alert('Twitter login failed: ' + response.error);
                                }
                            }, {scope: 'openid profile email'});
                }
            });
}
function ttGetInfo() {
    console.log("before info function call");
    $.ajax({
        url: "http://www.logicupsolutions.com/twitter/index.php",
        type: "get",
        success: function (data) {
            console.log(JSON.stringify(data));
            data = JSON.parse(data);
            alert("Welcome, " + data.name + " !");
            localStorage.social = "twitter";
            window.location = "profile.html";
        },
        error: function (data) {
            alert("Error");
            console.log("info function error");
        }
    });
    console.log("after info function call");
//    openGL.api({
//        success: function (data) {
//            console.log(JSON.stringify(data));
//            alert("Welcome, " + data.name + " !");
//            localStorage.social = "twitter";
//            window.location = "profile.html";
//        },
//        error: function (error) {
//            alert(error.message);
//        }
//    });
}
function ttLogout() {
    openTT.logout(
            function () {
                alert('Logout successful');
                window.location = "index.html";
            },
            function (error) {
                alert(error.message);
            });
}