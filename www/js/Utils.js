function Utils(){
	window.onload = function () {
	     if (typeof google === 'object' && typeof google.maps === 'object') {
			
		} else {
			var script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCJehKn3JAo02kj6fGFqJMDWkwbnAoBqVM&libraries=geometry',
			script.id = 'mapScript';
			document.body.appendChild(script);
		}
	}
	
};


Utils.prototype.getLatLongFromAddress = function(address, onGeoSuccess){
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode( { 'address': address}, function(results, status) {
		if ( status == google.maps.GeocoderStatus.OK) {
			//alert(results[0].geometry.location.lat() + ":" + results[0].geometry.location.lng());
			onGeoSuccess(results[0].geometry.location.lat(), results[0].geometry.location.lng());
		} else {
			console.log('Geocode was not successful for the following reason: ' + status);
		}
	});
};


Utils.prototype.getLatLongRange = function(lat,lng){	
	var lat1 = lat - 1,
		lat2 = lat + 1,
		long1 = lng - 1,
		long2 = lng +1;
		
	return {"latitude1": lat1, "latitude2": lat2, "longitude1":long1, "longitude2": long2};
};