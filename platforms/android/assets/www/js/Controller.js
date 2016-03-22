var Controller = function () {
	var hostUrl = "http://vps.hilfe.website:8080/HelpPalMidTier",
	//var hostUrl = "http://localhost:8080/HelpPalMidTier",
	clientId = "helpMePal",
	userLoggedIn, watchID;//, cordova =false;
	
	var controller = {
		_self : null,
		_latlng : null,
		
		initialize : function () {
			_self = this;
			utils = new Utils();
			this.bindEvents();
			_self.checkLogin();

			openFB.init({
				appId : '1065042693563296',
				tokenStore : window.localStorage
			});

			openGL.init({
				appId : '821146040968-irk2gq60rt4f10quu9blrbtcs7345j98.apps.googleusercontent.com',
				tokenStore : window.localStorage
			});
			
			$(document).delegate("#page-welcome", "pagebeforeshow", function (event, data) {
				_self.welcome();
			});

			$(document).delegate("#page-login", "pagebeforeshow", function () {
				_self.login();
			});

			$(document).delegate("#page-edit", "pagebeforeshow", function () {
				_self.edit();
			});

			$(document).delegate("#page-signup", "pagebeforeshow", function () {
				_self.signup();
			});

			$(document).delegate("#page-forgot", "pagebeforeshow", function () {
				_self.forgotPassword();
			});

			$(document).delegate("#page-reset", "pagebeforeshow", function () {
				_self.resetPassword();
			});

			$(document).delegate("#page-home", "pagebeforeshow", function () {
				_self.home();
			});

			$(document).delegate("#page-search", "pagebeforeshow", function () {
				_self.search();
			});
		},
		
		search : function() {
			var that = this;
			this.$searchPage = $('#page-search');

			this.$txtSearchUser = $('#txtSearchUser', this.$searchPage);
			this.$txtSearchLocation = $('#txtSearchLocation', this.$searchPage);

			this.$txtSearchUser.val("");
			this.$txtSearchLocation.val("");

			this.$lstSearchUser = $('#lstSearchUser', this.$searchPage);
			this.$lstSearchLocation = $('#lstSearchLocation', this.$searchPage);

			this.$lstSearchUser.empty();
			this.$lstSearchLocation.empty();

			$('#tabUser').find('.txtFound').text('0 User found near to you.');
			$('#tabLocation').find('.txtFound').text('0 User found near to you.');

			this.$txtSearchUser.off('change');
			this.$txtSearchUser.on('change', function(){
				var name = that.$txtSearchUser.val();
				that.$lstSearchUser.empty();
				_self.loading("show");
				$.ajax({
					url : hostUrl.concat("/search/name?name=" + name),
					type : 'GET'
				}).done(function (user) {
					var count = 0;
					if (user.length > 0) {
						for(var i=0; i < user.length; i++){
							var obj = user[i];
							if(userLoggedIn !== obj.username){
								count++;
								that.$lstSearchUser.append("<li class='listItem' id='lstItem-" + i + "'><div class='lstProfilePicDiv'><img class='lstProfilePic' src='images/defaultImg.png'/></div><div class='lstInfoDiv'><h1 class='list-name'>" + obj.name + "</h1><p class='list-email'>" + obj.email + " </p></div></li>");

								if(obj.username.indexOf('fb') !==-1 || obj.username.indexOf('gl') !==-1){
									$("#lstItem-"+i).find('.lstProfilePic').attr('src', hostUrl + "/profilePic/" + obj.username);
								} else {
									$.ajax({
										url : hostUrl + "/profilePic/" + obj.username,
										type : 'GET',
										context : $("#lstItem-"+i),
										async : true
									}).done(function (dataURL) {
										if (dataURL) {
											$(this).find('.lstProfilePic').attr('src', 'data:image/png;base64,' + dataURL);
										}
									});
								}
							}
							
						}
					} else {
						_self._showAlert("No result found for current search criteria.");
					}
					$('#tabUser').find('.txtFound').text(count + ' User found near to you.');
					_self.loading("hide");
				});

			});

			this.$txtSearchLocation.off('change');
			this.$txtSearchLocation.on('change', function(){
				var addr = that.$txtSearchLocation.val();
				that.$lstSearchLocation.empty();
				_self.loading("show");
				utils.getLatLongFromAddress(addr, function (lat, lng) {
					var obj = utils.getLatLongRange(lat, lng);
					$.ajax({
						url : hostUrl.concat("/search/location"),
						type : 'GET',
						data : obj
					}).done(function (user) {
						var count = 0;
						if (user.length > 0) {
							for(var i=0; i < user.length; i++){
								var obj = user[i];
								if(userLoggedIn !== obj.username){
									count++;
									that.$lstSearchLocation.append("<li class='listItem' id='lstLocItem-" + i + "'><div class='lstProfilePicDiv'><img class='lstProfilePic' src='images/defaultImg.png'/></div><div class='lstInfoDiv'><h1 class='list-name'>" + obj.name + "</h1><p class='list-email'>" + obj.email + " </p></div></li>");

									if(obj.username.indexOf('fb') !==-1 || obj.username.indexOf('gl') !==-1){
										$("#lstLocItem-"+i).find('.lstProfilePic').attr('src', hostUrl + "/profilePic/" + obj.username);
									} else {
										$.ajax({
											url : hostUrl + "/profilePic/" + obj.username,
											type : 'GET',
											context : $("#lstLocItem-"+i),
											async : true
										}).done(function (dataURL) {
											if (dataURL) {
												$(this).find('.lstProfilePic').attr('src', 'data:image/png;base64,' + dataURL);
											}
										});
									}
								}
							}
						} else {
							_self._showAlert("No result found for current search criteria.");
						}
						$('#tabLocation').find('.txtFound').text(count + ' User found near to you.');
						_self.loading("hide");
					});
				});
			});

		},

		home : function() {
			_self.updateLocation();

			this.$homePage = $('#page-home');

			this.$btnLogout =  $('#btnLogout', this.$homePage);

			this.$btnLogout.off('click', _self.onLogoutClickHandler);
			this.$btnLogout.on('click', _self.onLogoutClickHandler);
		},

		checkLogin : function () {
			navigator.geolocation.getCurrentPosition(function(success){
				
			}, function(error){
				function okCallback(){
					navigator.app.exitApp();
				};
				_self._showAlert("Please enable your location services to use HelpPal.", okCallback);
			} );
			
			//_self.initPushwoosh();
			_self.welcome();
			
			if (window.localStorage.helppal_loginBy === "normal") {
				if (window.localStorage.instameet_refresh_token) {
					_self.directLoginApp("normal");
				}
			} else if (window.localStorage.helppal_loginBy === "fb") {
				openFB.getLoginStatus(function (response) {
					if (response.status === "connected") {
						_self.directLoginApp("fb");
					} else {
						$.mobile.navigate("#page-welcome");
					}
				});
			} else if (window.localStorage.helppal_loginBy === "gl") {
				openGL.getLoginStatus(function (response) {
					if (response.status === "connected") {
						_self.directLoginApp("gl");
					} else {
						$.mobile.navigate("#page-welcome");
					}
				});
			}
			
		},
		
		directLoginApp : function (loginBy) {
			function loginSuccess() {
				$.mobile.navigate('#page-home');
				userLoggedIn = window.localStorage.helppal_userLogIn;
				window.localStorage.helppal_loginBy = loginBy;
				if(_self.pushNotification){
					_self.pushNotification.setTags({"helppalUsername":userLoggedIn},
						function(status) {
							console.warn('setTags success');
							_self.pushNotification.registerDevice(
								function(status) {
									var pushToken = status;
									console.warn('push token: ' + pushToken);
									
								},
								function(status) {
									console.warn(JSON.stringify(['failed to register ', status]));
								}
							);
						},
						function(status) {
							console.warn('setTags failed');
						}
					);
				}
				
				//_self.updateLocation();
			};

			function refreshTokenFailure() {
				_self.loading(false);
				$.mobile.navigate("#page-welcome");
			};

			function passwordFailure() {
				_self.loading(false);
				$.mobile.navigate("#page-welcome");
			};

			var authentication = new AuthenticationProxy(hostUrl, clientId, loginSuccess, refreshTokenFailure, passwordFailure);
			authentication.loginWithRefreshToken(window.localStorage.helppal_refresh_token);
		},
		
		bindEvents : function () {
			document.addEventListener("backbutton", _self.backButtonHandler, false);
		},
				
		backButtonHandler : function (event) {
			if($.mobile.activePage.is('#page-welcome')){
				navigator.app.exitApp();
			} else if($.mobile.activePage.is('#page-home')){
				_self.onLogoutClickHandler();
			} else {
				navigator.app.backHistory();
			}
		},
		
		onLogoutClickHandler : function () {
			function onConfirm(button){
				if(button === 1){	
					_self.loading('show');
					$.ajax({
						url : hostUrl.concat("/logout?access_token=" + window.bearerToken),
						type : 'GET'
					}).done(function () {
						if (window.localStorage.helppal_loginBy === "fb") {
							openFB.logout(function () {
								_self.clearAll();
								$.mobile.navigate('#page-welcome');
							});
						}if (window.localStorage.helppal_loginBy === "fb") {
							openGL.logout(function () {
								_self.clearAll();
								$.mobile.navigate('#page-welcome');
							});
						} else {
							_self.clearAll();
							$.mobile.navigate('#page-welcome');
						}
					});
				}
			};
			
			if(navigator.notification){
				navigator.notification.confirm(
					'Are you sure you want to logout?',  // message
					onConfirm,              // callback to invoke with index of button pressed
					'Logout',            // title
					['Yes','No']          // buttonLabels
				);
			} else {
				onConfirm(1);
			}
		},
		
		clearAll: function(){
			_self.loading('hide');

			if (watchID != null) {
				navigator.geolocation.clearWatch(watchID);
				watchID = null;
			}

			window.localStorage.removeItem('helppal_refresh_token');
			window.localStorage.removeItem('helppal_loginBy');
			window.localStorage.removeItem('fbtoken');
			window.localStorage.removeItem('gltoken');
			
			if(_self.pushNotification){
				_self.pushNotification.setTags({"helppalUsername":null},
					function(status) {
						console.warn('setTags success');
						_self.pushNotification.unregisterDevice(
							function(status) {
								var pushToken = status;
								console.warn('push token: ' + pushToken);
								
							},
							function(status) {
								console.warn(JSON.stringify(['failed to register ', status]));
							}
						);
					},
					function(status) {
						console.warn('setTags failed');
					}
				);
			}
			
		},
		
		welcome : function () {
			$('#btn-fb').off('click');
			$('#btn-fb').on('click', function (evt) {
				_self.loading('show');
				openFB.getLoginStatus(function (response) {
					if (response.status === "connected") {
						_self.getSocialData('fb');
					} else {
						openFB.login(function (response) {
							if (response.status === 'connected') {
								_self.getSocialData('fb');
							} else {
								_self._showAlert('Facebook login failed: ' + response.error);
							}
						},{ scope : 'email,read_stream' });
					}
				});
				evt.preventDefault();
			});

			$('#btn-gl').off('click');
			$('#btn-gl').on('click', function(evt) {
				_self.loading('show');
				openGL.getLoginStatus(function(response) {
					if (response.status === "connected") {
						_self.getSocialData('gl');
					} else {
						openGL.login(function(response) {
							if (response.status === 'connected') {
								_self.getSocialData('gl');
							} else {
								_self._showAlert('Google login failed: ' + response.error);
							}
						}, {scope: 'openid profile email'});
					}
				});
				evt.preventDefault();
			});
		},
		
		getSocialData : function (social) {
			if(social === 'fb'){
				openFB.api({
					path: '/me',
					params:{'fields':'name,email,picture'},
					success: function (data) {
						_self._checkIfSocialUserExist(data,'fb');
					},
					error: function (error) {
						console.log(error.message);
					}
				});
			} else if(social === 'gl'){
				openGL.api({
					path: '/userinfo',
					success: function (data) {
						_self._checkIfSocialUserExist(data,'gl');
					},
					error: function (error) {
						_self._showAlert(error.message);
					}
				});
			}
		},
		
		_checkIfSocialUserExist: function(data, social){
			var that = this;
			this.data = data;
			this.social = social;
			
			$.ajax({
				url : hostUrl + "/validate/username",
				type : 'POST',
				data : "username=" + social + '_' + data.email,
				processData : false,
				contentType : "application/x-www-form-urlencoded"
			}).done(function (data) {
				if (data === 1) {
					_self.processSocialLogin(that.data, that.social);
				} else {
					_self.registerSocialUser(that.data, that.social);
				}
			});
		},
		
		processSocialLogin: function(data, social){
			var that = this;
			this.data = data;
			this.social = social;
			function loginSuccess() {
				if(_self.pushNotification){
					_self.pushNotification.setTags({"helppalUsername":userLoggedIn},
						function(status) {
							console.warn('setTags success');
							_self.pushNotification.registerDevice(
								function(status) {
									var pushToken = status;
									console.warn('push token: ' + pushToken);
									
								},
								function(status) {
									console.warn(JSON.stringify(['failed to register ', status]));
								}
							);
						},
						function(status) {
							console.warn('setTags failed');
						}
					);
				}				
				_self.loading('hide');
				$.mobile.navigate("#page-home");
				window.localStorage.helppal_userLogIn = userLoggedIn = that.social+'_'+that.data.email;
				window.localStorage.helppal_loginBy = that.social;
				//_self.updateLocation();
			};

			function refreshTokenFailure() {
				_self.loading("hide");
				$.mobile.navigate("#page-login");
			};

			function passwordFailure() {
				_self.loading("hide");
			};

			var authentication = new AuthenticationProxy(hostUrl, clientId, loginSuccess, refreshTokenFailure, passwordFailure);
			if(this.social === 'fb'){
				authentication.loginWithPassword('fb_'+data.email, 'fbUser');
			} else if(this.social === 'gl'){
				authentication.loginWithPassword('gl_'+data.email, 'glUser');
			}
			
		},
		
		registerSocialUser: function(data, social){
			var that = this, formData = new FormData();
			this.data = data;
			this.social = social;
			this.profilePic = null;
			if(social === 'fb'){
				$.ajax({
					url: "https://graph.facebook.com/"+data.id+"/picture?redirect=false&type=large",
					type: 'GET'
				}).done(function(data){
					var image = new Image();
					image.setAttribute('crossOrigin', 'anonymous');
					image.onload = function () {
						var canvas = document.createElement('canvas');
						canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
						canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

						canvas.getContext('2d').drawImage(this, 0, 0);
						that.profilePic = canvas.toDataURL('image/png');
						
						if(that.data.email){
							formData.append('name', that.data.name);
							formData.append('email', that.data.email+'_'+new Date().getTime());
							if(that.social === 'fb'){
								formData.append('username', 'fb_'+that.data.email);
								formData.append('password','fbUser');
							} else if(that.social === 'gl'){
								formData.append('username', 'gl_'+that.data.email);
								formData.append('password','glUser');
							}
							formData.append('contact', '');
							formData.append('visible', '1');
							if(that.profilePic !== null){
								formData.append('profilePic', _self.dataURItoBlob(that.profilePic));
							}
							
							$.ajax({
								url : hostUrl + "/resources",
								type : 'POST',
								data : formData,
								processData : false,
								contentType : false
							}).done(function (data) {
								_self.processSocialLogin(that.data, that.social);
							}).fail(function (jqXHR, textStatus, errorThrown) {
								_self.loading("hide");
							});
						} else {
							_self._showAlert('App is not able to fetch your details. Please check your account settings.');
						}
						
					};

					image.src = data.data.url;
				});
			} else {
				if(that.data.email){
					formData.append('name', that.data.name);
					formData.append('email', that.data.email+'_'+new Date().getTime());
					if(that.social === 'fb'){
						formData.append('username', 'fb_'+that.data.email);
						formData.append('password','fbUser');
					} else if(that.social === 'gl'){
						formData.append('username', 'gl_'+that.data.email);
						formData.append('password','glUser');
					}
					formData.append('contact', '');
					formData.append('visible', '1');
					if(that.profilePic !== null){
						formData.append('profilePic', _self.dataURItoBlob(that.profilePic));
					}
					
					$.ajax({
						url : hostUrl + "/resources",
						type : 'POST',
						data : formData,
						processData : false,
						contentType : false
					}).done(function (data) {
						_self.processSocialLogin(that.data, that.social);
					}).fail(function (jqXHR, textStatus, errorThrown) {
						_self.loading("hide");
					});
				} else {
					_self._showAlert('App is not able to fetch your details. Please check your account settings.');
				}
			}
		},
		
		
		login : function () {
			var that = this;
			this.$login = $("#page-login");

			this.$txtUsername = $('#txt-username', this.$login);
			this.$txtPassword = $('#txt-password', this.$login);
			this.$btnLogin = $('#btnLogin', this.$login);

			this.$txtUsername.val("");
			this.$txtPassword.val("");
			
			this.$btnLogin.off('click');
			this.$btnLogin.on('click', function (event) {
				_self.loading('show');
				
				window.localStorage.helppal_userLogIn = userLoggedIn = that.$txtUsername.val();
				function loginSuccess() {
					_self.isResetPassRequired();
					window.localStorage.helppal_loginBy = "normal";
					if(_self.pushNotification){
						_self.pushNotification.setTags({"helppalUsername":userLoggedIn},
							function(status) {
								console.warn('setTags success');
								_self.pushNotification.registerDevice(
									function(status) {
										var pushToken = status;
										console.warn('push token: ' + pushToken);
										
									},
									function(status) {
										console.warn(JSON.stringify(['failed to register ', status]));
									}
								);
							},
							function(status) {
								console.warn('setTags failed');
							}
						);
					}
					
					//_self.updateLocation();
				};

				function refreshTokenFailure() {
					_self.loading('hide');
					$.mobile.navigate("#page-login");
				};

				function passwordFailure() {
					_self.loading('hide');
					_self._showAlert('Invalid Username and Password');
				};

				var authentication = new AuthenticationProxy(hostUrl, clientId, loginSuccess, refreshTokenFailure, passwordFailure);
				authentication.loginWithPassword(that.$txtUsername.val(), that.$txtPassword.val());
			});
		},
		

		onLocationError : function (error) {
			console.log('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
		},

		updateLocation : function () {
			if (watchID != null) {
				navigator.geolocation.clearWatch(watchID);
				watchID = null;
			}

			var options = {enableHighAccuracy: true, maximumAge: 0, desiredAccuracy: 0 };
			
			watchID = navigator.geolocation.watchPosition(function (position) {
				var lat = position.coords.latitude,
				lon = position.coords.longitude;

				/*var p1 = new google.maps.LatLng(_self._latlng.latitude, _self._latlng.longitude);
				var p2 = new google.maps.LatLng(lat, lon);

				var dist = Math.round(google.maps.geometry.spherical.computeDistanceBetween(p1, p2)/1000);*/
				_self._latlng = {
					"latitude" : lat,
					"longitude" : lon
				};

				$.ajax({
					url : hostUrl.concat("/resources/updateLocation?access_token=" + window.bearerToken),
					type : 'PUT',
					data : _self._latlng
				}).done(function (data, textStatus, jqXHR) {
					console.log("location updated successfully.");
				}).fail(function(){
					console.log("Location Error.");
				});
			}, _self.onLocationError, options);				
		},

		forgotPassword : function () {
			var that = this;
			this.$forgotPass = $('#page-forgot');
			this.$inpForgotUsername = $('#inpForgotUsername', this.$forgotPass);
			this.$inpForgotUsername.val("");

			this.$btnForgotSubmit = $('#btnForgotSubmit', this.$forgotPass);

			this.$btnForgotSubmit.off('click');
			this.$btnForgotSubmit.on('click', function (e) {
				if (that.$inpForgotUsername.val() === "") {
					_self._showAlert("Enter username.");
				} else {
					_self.loading("show");
					$.ajax({
						url : hostUrl.concat("/password/forgot"),
						type : 'PUT',
						data : {
							"username" : that.$inpForgotUsername.val()
						},
					}).done(function (o) {
						_self.loading("hide");
						$.mobile.navigate('#page-login');
					});
				}
				e.preventDefault();
			});
		},
		
		isResetPassRequired : function () {
			$.ajax({
				url : hostUrl.concat("/password/reset?access_token=" + window.bearerToken),
				type : 'GET',
				data : {
					"username" : userLoggedIn
				}
			}).done(function (data) {
				if (data == 0) {
					$.mobile.navigate('#page-home');
				} else {
					$.mobile.navigate('#page-reset');
				}
				_self.loading('hide');
			});
		},

		resetPassword : function () {
			var that = this;
			this.$resetPass = $('#page-reset');

			this.$oldPass = $('#oldPass', this.$resetPass);
			this.$newPass = $('#newPass', this.$resetPass);
			this.$confNewPass = $('#confNewPass', this.$resetPass);
	
			this.$oldPass.val("");
			this.$newPass.val("");
			this.$confNewPass.val("");

			$('#resetPassForm').off('submit');
			$('#resetPassForm').submit(function (e) {
				if (that.$oldPass.val() === "") {
					_self._showAlert("Temporary Password can not be empty.");
				} else if (that.$newPass.val() !== that.$confNewPass.val()) {
					_self._showAlert("Password and Confirm Password needs to be same.");
				} else {
					_self.loading("show");
					$.ajax({
						url : hostUrl.concat("/password/reset?access_token=" + window.bearerToken),
						type : 'PUT',
						data : {
							"username" : userLoggedIn,
							"password" : that.$newPass.val()
						}
					}).done(function (o) {
						_self.loading("hide");
						$.mobile.navigate('#page-home');
					});
				}
				e.preventDefault();
			});
		},

		feedback : function () {
			var that = this;
			this.$feedbackpage = $("#page-feedback");

			$('#btnSendFeedback', this.$feedbackpage).off('click');
			$('#btnSendFeedback', this.$feedbackpage).on('click', function (e) {
				_self.loading("show");
				var subject = $('#txtFeedbackSubject').val(),
				message = $('#taFeedbackMessage').val();
				$.ajax({
					url : hostUrl.concat("/feedback?access_token=" + window.bearerToken),
					type : 'POST',
					data : {
						'subject' : subject,
						'message' : message
					}
				}).done(function () {
					_self.loading("hide");
					_self._showAlert("Feedback sent successfully.");
					$('#txtFeedbackSubject').val(''),
					$('#taFeedbackMessage').val('');
				}).fail(function () {
					_self.loading("hide");
					_self._showAlert("Feedback could not be send.");
				});
				e.preventDefault();
			});
		},

		edit : function () {
			this.$editpage = $("#page-edit");
			var that = this;
			$('#btnCancel', this.$editpage).off('click');
			$('#btnCancel', this.$editpage).on('click', function () {
				$.mobile.navigate('#page-home');
			});
			$('#imgEditDisp', this.$edittPage).attr('src', './img/defaultImg.png');
			function geocodeCallback(address){
				$("#city", this.$editpage).val(address);
			}
			
			map.geocodeLatLong(_self._latlng, geocodeCallback);
			
			$.ajax({
				url : hostUrl.concat("/resources/fetch?access_token=" + window.bearerToken),
				type : 'GET'
			}).done(function (user) {
				this.$editpage = $("#page-edit");
				
				$("#username", this.$editpage).val(user.username);
				$("#name", this.$editpage).val(user.name);
				$("#skills", this.$editpage).val(user.skills);
				$("#email", this.$editpage).val(user.email);
				$("#contact", this.$editpage).val(user.contact);

				if (user.visible === 1) {
					$("#editVisible", this.$editpage)[0].checked = 1;
					$("#editVisible", this.$editpage)[0].value = 1;
				} else {
					$("#editVisible", this.$editpage)[0].checked = 0;
					$("#editVisible", this.$editpage)[0].value = 0;
				}

				$('#editVisible').off('change');
				$('#editVisible').on('change', function () {
					var bol = $("#editVisible").is(":checked") ? 1 : 0;
					$('#editVisible').val(bol);
				});

				that.editPic = null;

				if(user.username.indexOf('fb') !==-1 || user.username.indexOf('gl') !==-1){
					$('#imgEditDisp', this.$editpage).find('img').attr('src', hostUrl + "/profilePic/" + user.username);
				} else {
					$.ajax({
						url : hostUrl + "/profilePic/" + user.username,
						type : 'GET'
					}).done(function (dataURL) {
						if (dataURL) {
							$('#imgEditDisp', this.$editpage).attr('src', 'data:image/png;base64,' + dataURL);
						}
						
						that.editPic = dataURL;
					});
				}
				

				$('#btnEditImgUpload', this.$editpage).off('click');
				$('#btnEditImgUpload', this.$editpage).on('click', function (event) {
					navigator.camera.getPicture(onCapturePhotoSuccess, onCapturePhotoError, {
						destinationType : navigator.camera.DestinationType.FILE_URI,
						sourceType : navigator.camera.PictureSourceType.PHOTOLIBRARY,
						allowEdit: true,
						targetWidth: 250,
						targetHeight: 250
					});

					function onCapturePhotoSuccess(imageData) {
						window.resolveLocalFileSystemURL(imageData, gotFileEntry, failSystem);
					}

					function gotFileEntry(fileEntry) {
						//convert all file to base64 formats
						fileEntry.file(function (file) {
							//alert(file.size);
							var reader = new FileReader();
							reader.onloadend = function (evt) {
								$('#imgEditDisp').attr('src', evt.target.result);
								console.log(_self.dataURItoBlob(evt.target.result));
								that.editPic = _self.dataURItoBlob(evt.target.result);
							};
							reader.readAsDataURL(file);
						}, function (message) {
							_self._showAlert('Failed because: ' + message);
						});
					}

					function failSystem() {
						_self._showAlert('failed');
					}

					function onCapturePhotoError(message) {
						_self._showAlert('Captured Failed because: ' + message);
					}

					event.preventDefault();
				});

				$('#form-edit').off("submit");
				$('#form-edit').submit(function (e) {
					_self.loading("show");
					var formData = new FormData($("#form-edit")[0]);
					if (that.editPic !== null) {
						formData.append('profilePic', that.editPic);
					}

					$.ajax({
						url : hostUrl.concat("/resources/update?access_token=" + window.bearerToken),
						type : 'POST',
						data : formData,
						processData : false,
						contentType : false
					}).done(function (o) {
						_self.loading("hide");
						$.mobile.navigate('#page-home');
					}).fail(function () {
						_self.loading("hide");
					});
					e.preventDefault();
				});
			});
		},

		signup : function () {
			var that = this;
			this.$signUp = $('#page-signup');
			this.$username = $('#txt-username', this.$signUp);
			this.$name = $('#txt-name', this.$signUp);
			this.$contact = $('#txt-contact', this.$signUp);
			this.$email = $('#txt-email', this.$signUp);
			this.$pass = $('#txt-password', this.$signUp);
			this.$confirmPass = $('#txt-confirmpassword', this.$signUp);
			this.$btnUpload = $("#btnUpload", this.$signUp);
			this.$imgDisp = $("imgDisp", this.$signUp);
			this.$chkVisible = $("chk-visible", this.$signUp);
			this.$chkTerms = $("chk-terms", this.$signUp);

			this.$error = $('#error', this.$signUp);

			this.$username.val("");
			this.$name.val("");
			this.$contact.val("");
			this.$email.val("");
			this.$pass.val("");
			this.$confirmPass.val("");

			this.$imgDisp.attr('src', './images/defaultImg.png');
			
			this.$username.off('focusout');
			this.$username.on('focusout', function (e) {
				_self._setInputState(that.$username, " ", 0, that.$error);
				if(that.$username.val() === ''){
					_self._setInputState(that.$username, "Username cannot be empty.", 1, that.$error);
				} else {
					$.ajax({
						url : hostUrl + "/validate/username",
						type : 'POST',
						data : "username=" + that.$username.val(),
						processData : false,
						contentType : "application/x-www-form-urlencoded"
					}).done(function (data) {
						_self._setInputState(that.$username, "Username is already taken.", data, that.$error);
					}).fail(function (jqXHR, textStatus, errorThrown) {
						
					});
				}
				e.preventDefault();
			});

			this.$contact.off('focusout');
			this.$contact.on('focusout', function(){
				_self._setInputState(that.$contact, " ", 0, that.$error);
				if(that.$contact.val() === ''){
					_self._setInputState(that.$contact, "Contact cannot be empty.", 1, that.$error);
				}
			});
			
			this.$name.off('focusout');
			this.$name.on('focusout', function(){
				_self._setInputState(that.$name, " ", 0, that.$error);
				if(that.$name.val() === ''){
					_self._setInputState(that.$name, "Name cannot be empty.", 1, that.$error);
				}
			});

			this.$email.off('focusout');
			this.$email.on('focusout', function (e) {
				_self._setInputState(that.$email, " ", 0, that.$error);
				if(that.$email.val() === ''){
					_self._setInputState(that.$email, "Email cannot be empty.", 1, that.$error);
				} else if (!_self.validateEmail(that.$email.val())) {
					_self._setInputState(that.$email, "Email is invalid.", 1, that.$error);
				} else {
					$.ajax({
						url : hostUrl + "/validate/email",
						type : 'POST',
						data : "email=" + that.$email.val(),
						processData : false,
						contentType : "application/x-www-form-urlencoded"
					}).done(function (data) {
						_self._setInputState(that.$email, "Email is already taken.", data, that.$error);
					}).fail(function (jqXHR, textStatus, errorThrown) {
						//alert(jqXHR + ":" + textStatus + ":" + errorThrown);
						//alert(jqXHR.responseText);
					});
				}
				e.preventDefault();

			});

			this.$pass.off('focusout');
			this.$pass.on('focusout', function(){
				_self._setInputState(that.$pass, " ", 0, that.$error);
				if(that.$pass.val() === ''){
					_self._setInputState(that.$pass, "Password cannot be empty.", 1, that.$error);
				}
			});

			this.$confirmPass.off('focusout');
			this.$confirmPass.on('focusout', function(){
				_self._setInputState(that.$confirmPass, " ", 0, that.$error);
				if(that.$confirmPass.val() === ''){
					_self._setInputState(that.$confirmPass, "Confirm Password cannot be empty.", 1, that.$error);
				}
			});

			that.pic = null;
			this.$btnUpload.off('click');
			this.$btnUpload.on('click', function (event) {
				navigator.camera.getPicture(onCapturePhotoSuccess, onCapturePhotoError, {
					destinationType : navigator.camera.DestinationType.FILE_URI,
					sourceType : navigator.camera.PictureSourceType.PHOTOLIBRARY,
					allowEdit: true,
					targetWidth: 250,
					targetHeight: 250
				});

				function onCapturePhotoSuccess(imageData) {
					window.resolveLocalFileSystemURI(imageData, gotFileEntry, failSystem);
				}

				function gotFileEntry(fileEntry) {
					//convert all file to base64 formats
					fileEntry.file(function (file) {
						var reader = new FileReader();
						reader.onloadend = function (evt) {
							$('#imgDisp').attr('src', evt.target.result);

							that.pic = _self.dataURItoBlob(evt.target.result);
						};
						reader.readAsDataURL(file);
					}, function (message) {
						_self._showAlert('Failed because: ' + message);
					});
				}

				function failSystem() {
					_self._showAlert('failed');
				}

				function onCapturePhotoError(message) {
					_self._showAlert('Captured Failed because: ' + message);
				}

				event.preventDefault();
			});

			this.$chkVisible.off('change');
			this.$chkVisible.on('change', function () {
				var bol = that.$chkVisible.is(":checked") ? 1 : 0;
				that.$chkVisible.val(bol);
			});

			this.$chkTerms.off('change');
			this.$chkTerms.on('change', function () {
				var bol = that.$chkTerms.is(":checked") ? 1 : 0;
				that.$chkTerms.val(bol);
			});

			$('#btn-signUp').off('click');
			$('#btn-signUp').on('click', function (e) {
				if (that.$pass.val() !== that.$confirmPass.val()) {
					_self._showAlert("Password and confirm password must match!");
				} /*else if(that.$chkVisible) {
					_self._showAlert("You need to accept the terms.");
				}*/ else if (that.$username.val() != "" && that.$email.val() != "" && that.$pass.val() != "" && that.$confirmPass.val() != "") {
					_self.loading('show');
					var formData = new FormData($("#form-signup")[0]);
					if (that.pic !== null) {
						formData.append('profilePic', that.pic);
					}

					$.ajax({
						url : hostUrl + "/resources",
						type : 'POST',
						data : formData,
						processData : false,
						contentType : false
					}).done(function (data) {
						_self.loading('hide');
						$.mobile.navigate('#page-login');
					}).fail(function (jqXHR, textStatus, errorThrown) {
						_self.loading('hide');
						_self._showAlert("Could not register user. Please contact your administrator.");
						//alert(jqXHR + ":" + textStatus + ":" + errorThrown);
						//alert(jqXHR.responseText);
					});
				} else {
					_self._showAlert("All fields are mandatory.");
				}
				e.preventDefault();
			});
		},
		
		_setInputState: function(control, message, data, errorControl){
			if(data === 1){
				control.addClass('invalidInp');
				errorControl.text(message);
				errorControl.removeClass('display');
			} else {
				control.removeClass('invalidInp');
				errorControl.text("");
				errorControl.addClass('display');
			}
		},
				
		validateEmail : function (email) {
			var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return re.test(email);
		},
		loading : function (showOrHide) {
			setTimeout(function () {
				$.mobile.loading(showOrHide);
			}, 1);
		},
		
		dataURItoBlob : function (dataURI) {
			var byteString = atob(dataURI.split(',')[1]);

			var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

			var ab = new ArrayBuffer(byteString.length);
			var ia = new Uint8Array(ab);
			for (var i = 0; i < byteString.length; i++) {
				ia[i] = byteString.charCodeAt(i);
			}

			var bb = new Blob([ab], {
					"type" : mimeString
				});
			return bb;
		},
		
		_showAlert: function(message, callback){
			if(navigator.notification){
				if(callback){
					navigator.notification.alert(message, callback, 'HelpPal', 'OK')
				} else {
					navigator.notification.alert(message, null, 'HelpPal', 'OK')
				}
			}
		},
		
		_showConfirm: function(message, confirmCallback){
			if(navigator.notification){
				navigator.notification.confirm(message, confirmCallback, 'HelpPal', ['Yes','No'])
			}
		},
		
		initPushwoosh: function(){
			if(cordova){
				var pushNotification = cordova.require("com.pushwoosh.plugins.pushwoosh.PushNotification");
				_self.pushNotification = pushNotification;
				//set push notifications handler
				document.addEventListener('push-notification', function(event) {
					var title = event.notification.title;
					var userData = event.notification.userdata;
											 
					if(typeof(userData) != "undefined") {
						console.warn('user data: ' + JSON.stringify(userData));
					}
												 
					console.log(event.notification);
				});
			 
				//initialize Pushwoosh with projectid: "GOOGLE_PROJECT_NUMBER", pw_appid : "PUSHWOOSH_APP_ID". This will trigger all pending push notifications on start.
				pushNotification.onDeviceReady({ projectid: "105396803775", pw_appid : "EB3A4-8E46D"});
			 
				//register for pushes
				/*pushNotification.registerDevice(
					function(status) {
						var pushToken = status;
						console.warn('push token: ' + pushToken);
					},
					function(status) {
						console.warn(JSON.stringify(['failed to register ', status]));
					}
				);*/
			}
		}
	};

	controller.initialize();
	return controller;
};
