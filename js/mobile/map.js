mapUtils = function() {

var MAP, MAP_CONTROL, BASE_LAYERS = {};

var ATTRIBUTION = 'Map data &copy; '
  + '<a href="http://openstreetmap.org">OpenStreetMap</a> contributors, '
  + '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, '
  + 'Imagery &copy; MapBox';

/// https://github.com/ismyrnow/Leaflet.functionaltilelayer
function tilePath(fileSystem, mapID) {
    var rootDir = fileSystem.root.fullPath;
    if (rootDir[rootDir.length-1] != '/') { rootDir += '/'; }
    if(true){
        return "http://api.tiles.mapbox.com/v3/" + mapID + '/{z}/{x}/{y}.png';
    }
    else {return rootDir + 'tiles/' + mapID + '/{z}/{x}/{y}.png';}
}

function reloadMap(options) {
    /*
     * Clear layers and reset based
     * on current mapIDs
     */
     
    //handle options
    var clear = options['clear'] || false;
    var fileSystem = options['fileSystem'] || null;
    var mapboxIDs = options['mapIDs'] || null;
    
    if (!fileSystem) { alert('Must specify fileSystem'); return; }

    if (!MAP) { //initialize map if first time
    		if (window.running_mobile){
	        MAP = L.map('map', {
	        	'zoomControl':false,
	            'minZoom': MAP_MIN_ZOOM,
	            'maxZoom': MAP_MAX_ZOOM,
	            'layers': [funcLayer]
	        }).setView([64.1404809, -21.9113811], MAP_DEFAULT_ZOOM);
  	      MAP.locate({setView: true}); //, maxZoom: MAP_MAX_ZOOM
    		} else {
	        MAP = L.map('map', {
	        	'layers': [funcLayer]
	        }).setView([64.1404809, -21.9113811]);    			
    		}
		function onLocationFound(e) {
			var radius = e.accuracy / 2;
			//L.marker(e.latlng).addTo(map).bindPopup("You are within " + radius + " meters from this point").openPopup();
			if (window.user_marker == undefined){
				window.user_marker = L.marker(e.latlng);
				window.user_marker.addTo(map);
				window.user_circle = L.circle(e.latlng, radius);
				window.user_circle.addTo(map);
			} else { 
				window.user_marker.setLatLng(e.latlng);
				window.user_circle.setLatLng(e.latlng);
				window.user_circle.setRadius(radius);
			}
			locateNearbyMarkers(e.latlng);
		}

		function onLocationError(e) {
			showLoadingAnimation("GPS staðsettning: " + e.message, 4000);
		}

		MAP.on('locationfound', onLocationFound);
		MAP.on('locationerror', onLocationError);
		
		if(window.running_mobile){MAP.locate({setView: true, watch: true, enableHighAccuracy: true});}

    }
    window.map = MAP;
    
	window.resizeTimer;
	$(window).resize(function() {
		clearTimeout(window.resizeTimer);
		window.resizeTimer = setTimeout(resizeMap, 100);
	});    
}

return {
    'reloadMap': reloadMap
};

}();