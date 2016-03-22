var deviceReadyDeferred = $.Deferred();
var jqmReadyDeferred = $.Deferred();
var controller;

$(document).on("deviceready", function() {
  deviceReadyDeferred.resolve();
});

$(document).on("mobileinit", function () {
	//init()
  	jqmReadyDeferred.resolve();
});

$.when(deviceReadyDeferred, jqmReadyDeferred).then(init);

function init() {
	controller = new Controller();
	return this;
}
