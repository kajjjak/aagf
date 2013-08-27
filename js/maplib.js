///should this be empty?

          //var mobileDemo = { 'center': '64.14835000000001,-21.9307', 'zoom': 15 };
            
          ////////////////////////////////////////////////////////////
					var samplePoints = [
						[64.14835000000001,-21.9307]
					];
					preset_paths = [];
					
					var map, minimal, midnightCommander, motorways;
					var waypoints = [];
					var direction_pos = 0;

					walking_path_polyline = [];
					walking_path_attraction = []; 
					pointLayers = {};
					function setSelectedArea(area_name){	 
						window.selected_map_area = area_name;
						sessionStorage.setItem('selected_map_area', area_name); //$.cookie('map_area', area_name);
					} 
					 
					function setSelectedPath(path_name){	
						window.selected_map_path = path_name;
						sessionStorage.setItem('selected_map_path', path_name); // $.cookie('map_path', path_name);
					} 
					
					function getSelectedArea(){
						return sessionStorage.getItem('selected_map_area');
					}
					
					function getSelectedPath(){
						return sessionStorage.getItem('selected_map_path');
					}

					function showAreaPathDescription(){
						var path_name = getSelectedPath(); 
						var descr = "";
						pathInfo = window.itemsListView.getPathInfo(getSelectedArea(), path_name);
						if(pathInfo[path_name]){
							if(pathInfo[path_name].attraction){
								var startInfo = pathInfo[path_name].attraction[0];
								if (startInfo){ descr = startInfo.descr;}
							}
						}
						$("#about_map_description").html(descr);
					}

					function showAreaPathAttraction(use_gps, area, path){
						if (use_gps){
							window.map.locate({setView: true, watch: true, enableHighAccuracy: true});
						} else {
							window.map.locate({setView: false, watch: false, enableHighAccuracy: false});
						}
						window.use_gps = use_gps;
						setTimeout(function(){resizeMap();}, 1000);
						removeArea();
						//if (window.map){
						//	loadAreaPathAttraction(area_id, path_id);
						//} else {
						//  setTimeout(function(){loadAreaPathAttraction(area_id, path_id);}, 1000);
						//}
						reloadMapPathAndAttractions(area, path);
						hideLoadingAnimation();
					}
					
					function loadAreaPathAttraction (area_id, path_id){
						pathInfo = itemsListView.getPathInfo(area_id, path_id);
					    for (n in pathInfo){
					    	if (path_id == n){
					    		addWalkPath(n, map);	
					    	}
					    }
					}
					
					function removeArea(){
						/*
						for(i in walking_path_polyline){
							map.removeLayer(walking_path_polyline[i]);
						}
						for(i in walking_path_attraction){
							map.removeLayer(walking_path_attraction[i]);
						}*/
						for (i in window.pointLayers){
							map.removeLayer(pointLayers[i]);
						}
					}
					function showDescription(marker) {
						var infowindow_content = marker.attraction_descr;
						if (infowindow_content){
							if(marker.attraction_viewed == undefined){
								if (window.running_mobile && marker.attraction_content){
									infowindow_content = marker.attraction_descr + "<br><a href='#' onclick='showAttractionInfo(\"" + marker.schema_id + "\"); return false;'>meira</a>";
									marker.attraction_viewed = true;
								}
								marker.bindPopup("<p class='infowindow_content'>"+infowindow_content+"</p>");
							}
						}
					}
					function reloadMapPathAndAttractionsFromCache(){
						//TODO: save the itemList json file into data storage on save then load the routes here
						var map_routes_json = localStorageGetItem("map_routes");
						if (map_routes_json){
							map_routes = JSON.parse(map_routes_json);
					  		setTimeout(function(){
					  			itemsList.reset(map_routes);
					  			loadAreaPathAttraction(getSelectedArea(), getSelectedPath());
					  			hideLoadingAnimation(); 
					  			setTimeout(function(){map.invalidateSize(false);}, 400);
					  		}, 400);
						}
					}
					
					function reloadMapPathAndAttractions(area, path){
						area = area || getSelectedArea();
						path = path || getSelectedPath();
						if ((walking_path_attraction && walking_path_attraction.length) || itemsList.length){  // FIXME: itemsList will not work for many different books
							loadAreaPathAttraction(area, path);
						} else {
							setTimeout(function(){showLoadingAnimation("Sækir gönguleið", 120000);}, 300);
							if (hasNetworkConnection()){
								itemsList.fetch({
									success:function(){ 
										hideLoadingAnimation(); 
										loadAreaPathAttraction(area, path);
										setTimeout(function(){map.invalidateSize(false);}, 400);
										localStorageSetItem("map_routes", JSON.stringify(itemsList.toJSON()));
									},
									error: function(){reloadMapPathAndAttractionsFromCache();}
								});
							} else { reloadMapPathAndAttractionsFromCache(); }
						}
					}
					
					function getDistanceBetween(latlng1, latlng2){
						var lat1 = latlng1.lat;
						var lon1 = latlng1.lng;
						var lat2 = latlng2.lat;
						var lon2 = latlng2.lng;
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
								var dist = getDistanceBetween(latlng, mrkr.getLatLng());
								console.info("Distance ("+dist+") between me and " + mrkr.attraction_descr);
								if (dist < 1){
									openAttractionInfo(walking_path_attraction[indx])
								}
							}
						}
					}
					
					function openAttractionInfo(mrkr){
						if (mrkr.attraction_auto_displayed == 0){
							playSoundNotification();
							mrkr.openPopup();
							mrkr.attraction_auto_displayed = mrkr.attraction_auto_displayed + 1;
					    }else{
					    	if (mrkr.attraction_auto_displayed === undefined) { mrkr.attraction_auto_displayed = 0}
					    }
					}
					
					function addWalkPath(name){
						var samplePoints = pathInfo[name]["path"];
						var attractionPoints = pathInfo[name]["attraction"];
						var label = pathInfo[name]["label"];
						var latlngs = [];
						if (pointLayers[name] == undefined){
							pointLayers[name] = new L.LayerGroup();
							for (var i = 0; i < samplePoints.length; i++) {
								var latlng = new L.LatLng(samplePoints[i]["lat"], samplePoints[i]["lon"]);
								latlngs.push(latlng);
							}
							for (var i = 0; i < attractionPoints.length; i++){
								var latlng = [attractionPoints[i]["lat"], attractionPoints[i]["lon"]];
								if (attractionPoints[i]["descr"].trim() != ""){
									var iconClass = generalIcon;
									if (attractionPoints[i]["icon"] != undefined){
										ic = attractionPoints[i]["icon"];
										if (ic == 1){iconClass = window.attraction1Icon;}
										if (ic == 2){iconClass = window.attraction2Icon;}
										if (ic == 3){iconClass = window.attraction3Icon;}
										if (ic == 4){iconClass = window.attraction4Icon;}
									}
									var attr = new L.Marker(new L.LatLng(latlng[0], latlng[1]), {icon: iconClass});
									pointLayers[name].addLayer(attr)	
									attr.attraction_descr = attractionPoints[i]["descr"];
									attr.attraction_content = attractionPoints[i]["content"];
									attr.schema_id = attractionPoints[i]["_id"];
									showDescription(attr);
									walking_path_attraction.push(attr);
								}
							}
							var pl = L.polyline(latlngs, {color: name, opacity: 0.8, weight: 8, smoothFactor: 0.5})
							walking_path_polyline.push(pl);
							pl.addTo(pointLayers[name]);
							window.map_bounds = pl.getBounds();
							pointLayers[name].map_bounds = window.map_bounds;
						}
						pointLayers[name].addTo(map);
						map.fitBounds(pointLayers[name].map_bounds);
					}
					
					function createIcons (){
						// 2f7a49
						// http://mapicons.nicolasmollet.com/category/markers/tourism/?custom_color=2f7a49&style=
						window.AttractionIcon = L.Icon.extend({
						    options: {
						    	iconUrl: '/__db/_design/media/star-3.png',
						        shadowUrl: '/__db/_design/media/shadow.png',
						        iconSize:     [32, 37],
						        shadowSize:   [51, 37],
						        iconAnchor:   [16, 36],
						        shadowAnchor: [25, 36],
						        popupAnchor:  [0, -25]
						    }
						});	
						window.generalIcon = new AttractionIcon();
						window.attraction1Icon = new AttractionIcon({iconUrl: '/__db/_design/media/statue-2.png'});
						window.attraction2Icon = new AttractionIcon({iconUrl: '/__db/_design/media/forest2.png'});
						window.attraction3Icon = new AttractionIcon({iconUrl: '/__db/_design/media/moderntower.png'});
						window.attraction4Icon = new AttractionIcon({iconUrl: '/__db/_design/media/river-2.png'});
					}



function hasNetworkConnection(){
    return navigator.onLine;
}


if (window.localStorage_MAPBOX_IDS_ == undefined){ window.localStorage_MAPBOX_IDS_ = "kajjjak.map-wgrdoudp"; }
					
					