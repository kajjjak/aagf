var waypoints = [];
var markers = [];
map_settings = {'markers': {'draggable': false}};

function selectPath(path_name){
	$.cookie('map_path', path_name);
	if (window.map){
		showAreaPath();
	}else{
		setTimeout("showAreaPath()", 1000);
	}
}

function selectArea(area_name){	
	$.cookie('map_area', area_name);		
}

function updateScanRadius(map, latlng, rad){
	if (window.marker_radius == undefined){
      var populationOptions = {
        strokeColor: '#0000FF',
        strokeOpacity: 0.8,
        strokeWeight: 1,
        fillColor: '#0080FF',
        fillOpacity: 0.30,
        map: map,
        center: latlng,
        radius: rad
      };
      window.marker_radius = new google.maps.Circle(populationOptions);
	} else {
		window.marker_radius.setRadius(rad);
		window.marker_radius.setCenter(latlng);
	}
	var dt = new Date();
	$("#label_location_name").html("Staðsettning uppfært " + ("0" + dt.getHours()).slice(-2) + ":" + ("0" + dt.getMinutes()).slice(-2) + ":" + ("0" + dt.getSeconds()).slice(-2) + "");
}


function clearMarkers() {
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(null);
	}
}

function clearWaypoints() {
	markers = [];
	origin = null;
	destination = null;
	waypoints = [];
	directionsVisible = false;
}


function showAreaPath(map){
	if (map === undefined){
		var map = window.map;
	}
	clearMarkers();
	clearWaypoints();
	var area = $.cookie('map_area');
	var path = $.cookie('map_path');
	itemsListView.showIconByPathAndArea(path, area);		
}

function showArea(area_id){
	removeArea();
	if (window.map){
		loadArea(area_id);
	} else {
	  setTimeout(function(){loadArea(area_id);}, 1000);
	}
}

function loadArea(area_id){
	pathInfo = itemsListView.getPathInfo(area_id);
    for (n in pathInfo){
        addWalkPath(n, map);
    }	
}

walking_path_polyline = [];
walking_path_attraction = [];
var infowindow = new google.maps.InfoWindow();

function removeArea(){
	for(i in walking_path_polyline){
		walking_path_polyline[i].setMap();
	}
	for(i in walking_path_attraction){
		walking_path_attraction[i].setMap();
	}
	//map.removeControl(layersControl);
}

function showDescription(marker) {
    google.maps.event.addListener(marker, 'click', function() {
    	var infowindow_content = marker.attraction_descr;
    	if (window.running_mobile && marker.attraction_content){
    		infowindow_content = marker.attraction_descr + "<br><br><a href='#' onclick='showAttractionInfo(\"" + marker.schema_id + "\")'>meira</a>";
    	}
        infowindow.setContent(infowindow_content);
        infowindow.open(map, marker); //then opens the infowindow at the marker
    });
}

function addWalkPath(name){
	var samplePoints = pathInfo[name]["path"];
	var attractionPoints = pathInfo[name]["attraction"];
	var label = pathInfo[name]["label"];
	var latlngs = [];
	for (var i = 0; i < samplePoints.length; i++) {
		var latlng = new google.maps.LatLng(samplePoints[i]["lat"], samplePoints[i]["lon"]);
		latlngs.push(latlng);
	}
	for (var i = 0; i < attractionPoints.length; i++){
		var latlng = new google.maps.LatLng(attractionPoints[i]["lat"], attractionPoints[i]["lon"]);
		if (attractionPoints[i]["descr"].trim() != ""){
			var icon = undefined;
			var shadow = undefined;
			if (attractionPoints[i]["icon"] != undefined){
				icon = attractionPoints[i]["icon"];
				var shadow = new google.maps.MarkerImage(
	                'http://maps.gstatic.com/mapfiles/shadow50.png', null, null,
	                new google.maps.Point(10, 34)
	            );
			}
			var attr = new google.maps.Marker({
			      position: latlng,
			      map: map,
			      icon: icon,
			      shadow: shadow
			});
			attr.attraction_descr = attractionPoints[i]["descr"];
			attr.attraction_content = attractionPoints[i]["content"];
			attr.schema_id = attractionPoints[i]["_id"];
			showDescription(attr);
			walking_path_attraction.push(attr);
		}
	}
	var pl = new google.maps.Polyline({path: latlngs, strokeColor: name, strokeOpacity: 0.8, strokeWeight: 4})
	walking_path_polyline.push(pl);
	pl.setMap(map);
}

function getDistanceBetween(latlng1, latlng2){
	var lat1 = latlng1.lat();
	var lon1 = latlng1.lng();
	var lat2 = latlng2.lat();
	var lon2 = latlng2.lng();
	var R = 6371; // km
	var d = Math.acos(Math.sin(lat1)*Math.sin(lat2) + 
	                  Math.cos(lat1)*Math.cos(lat2) *
	                  Math.cos(lon2-lon1)) * R;
	return d;
}

function locateNearbyMarkers(latlng){
	if (window.map){
		for (indx in walking_path_attraction){
			var mrkr = walking_path_attraction[indx];
			var dist = getDistanceBetween(latlng, mrkr.getPosition());
			//console.info("Distance ("+dist+") between me and " + mrkr.attraction_descr);
			if (dist < 1){
				if (walking_path_attraction[indx].attraction_auto_displayed === undefined){
		        	//var attraction_descr = mrkr.attraction_descr;
		        	//if (mrkr.attraction_content){
		        	//	attraction_descr = attraction_descr + "<br>Meira";
		        	//}
		        	infowindow.setContent(mrkr.attraction_descr);
		        	infowindow.open(map, mrkr); //then opens the infowindow at the marker
		        	walking_path_attraction[indx].attraction_auto_displayed = true;
		        }
			}
		}
	}
}
