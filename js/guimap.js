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

function selectPathAttraction(path_name){
	window.selected_map_path = path_name;
}

function notifyDeveloper(message, title, state){
	toastr.options.positionClass = 'toast-bottom-right';
	if (state=="error"){
		toastr.options.timeOut = 0;
		toastr.error(message, title);
		return;
	} 
	if (state=="success"){
		toastr.options.timeOut = 2000;
		toastr.success(message, title);
		return;
	}
	toastr.options.timeOut = 1000;
	toastr.info(message, title);
}

function setSelectedMarker(marker){
	var mdl = itemsList.get(marker.schema_id);
    window.selected_marker = marker;	
    $("#markerDescr").val(mdl.get("descr"));
    $("#markerOrder").val(mdl.get("timestamp"));
    $("#markerName").val(mdl.get("name"));
    $("#markerPosition").val(mdl.get("lat") + ", " + mdl.get("lon"));
    $("#markerId").val(marker.schema_id);
    if (mdl.has("content")){
    	editorWrite(mdl.get("content"));
    }else{
    	editorWrite("");
    }
}

function setSelectedArea(area_name){	
	window.selected_map_area = area_name;
	localStorage.setItem('selected_map_area', area_name); //$.cookie('map_area', area_name);
}

function setSelectedPath(path_name){	
	window.selected_map_path = path_name;
	localStorage.setItem('selected_map_path', path_name); // $.cookie('map_path', path_name);
}

function getSelectedArea(){
	return localStorage.getItem('selected_map_area');
}

function getSelectedPath(){
	return localStorage.getItem('selected_map_path');
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
	//$("#label_location_name").html("Staðsettning uppfært " + ("0" + dt.getHours()).slice(-2) + ":" + ("0" + dt.getMinutes()).slice(-2) + ":" + ("0" + dt.getSeconds()).slice(-2) + "");
}

function clearMarkers() {
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(null);
	}
}

function getToggleEditablePathAddState(){
	return $('#toggle_editable_path_add').is(':checked');
}

function getToggleEditablePathState(){
	return $('#toggle_editable_path').is(':checked');
}

function toogleEditablePath(){
	var sel = getToggleEditablePathState();
	clearWaypointsEditable();
	if (sel){
		showEditablePath();
	}
}

function clearWaypointsEditable() {
	if (window.path_section_editable_steps) {
		if (window.path_section_editable_steps.length){
			for (i=0; i < window.path_section_editable_steps.length; i++){
				var m = path_section_editable_steps[i];
				m.setMap(null);
			}
		}
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

function showAreaPathAttraction(){
	area_id = getSelectedArea(); //$.cookie("map_area");
	path_id = getSelectedPath(); //$.cookie("map_path");
	removeArea();
	if (window.map){
		loadAreaPathAttraction(area_id, path_id);
	} else {
	  setTimeout(function(){loadAreaPathAttraction(area_id, path_id);}, 1000);
	}
}

function loadAreaPathAttraction (area_id, path_id){
	pathInfo = itemsListView.getPathInfo(area_id, path_id);
    for (n in pathInfo){
    	if (path_id == n){
    		addWalkPath(n, map);	
    	}
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
/* NOT USED AND OVERRIDEN BY guimap.js */
function showDescription(marker) {
    google.maps.event.addListener(marker, 'click', function() {
    	var infowindow_content = marker.attraction_descr;
    	if (window.running_mobile && marker.attraction_content){ 
    		infowindow_content = marker.attraction_descr + "<br><a href='#' onclick='showAttractionInfo(\"" + marker.schema_id + "\")'>meira zzz</a>";
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
		var latlng = new google.maps.LatLng(samplePoints[i]["lat"], samplePoints[i]["lon"], wrap_location);
		latlngs.push(latlng);
	}
	for (var i = 0; i < attractionPoints.length; i++){
		var latlng = new google.maps.LatLng(attractionPoints[i]["lat"], attractionPoints[i]["lon"], wrap_location);
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
	var pl = new google.maps.Polyline({path: latlngs, strokeColor: name, strokeOpacity: 0.8, strokeWeight: 8})
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
		        	infowindow.setContent(mrkr.attraction_descr);
		        	infowindow.open(map, mrkr); //then opens the infowindow at the marker
		        	walking_path_attraction[indx].attraction_auto_displayed = true;
		        }
			}
		}
	}
}