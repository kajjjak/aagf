var database_name = "__db";
var collection_schema = "8";
var database_ddoc = "data";
var database_view = "by_schema_view";
wrap_location = false;  

function getAttributesModelDescr(){
  return [ 
    {name: "Schema", field: "schema", width: 60, id: "schema", default_value:  "8" },
    {name: "Name", field: "name", width: 300, id: "name", default_value:  undefined },
    {name: "Descr", field: "descr", width: 300, id: "descr", default_value:  undefined },
    {name: "Area", field: "area", width: 120, id: "area", default_value:  undefined },
    {name: "path", field: "path", width: 120, id: "path", default_value:  undefined },
    {name: "Step index", field: "step_index", width: 120, id: "step_index", default_value:  undefined },
    {name: "Time stamp", field: "timestamp", width: 120, id: "timestamp", default_value:  undefined },
    {name: "Revision", field: "_rev", width: 30, id: "_rev", default_value:  undefined },
    {name: "Distance-value", field: "distance-value", width: 20, id: "distance-value", default_value:  "0" },
    {name: "Lon", field: "lon", width: 20, id: "lon", default_value:  "0" },
    {name: "Duration-text", field: "duration-text", width: 20, id: "duration-text", default_value:  undefined },
    {name: "Waypoint", field: "waypoint", width: 10, id: "waypoint", default_value:  "false" },
    {name: "Lat", field: "lat", width: 20, id: "lat", default_value:  "0" },
    {name: "Identifier", field: "_id", width: 60, id: "_id", default_value:  undefined },
    {name: "Duration-value", field: "duration-value", width: 20, id: "duration-value", default_value:  "0" },
    {name: "Distance-text", field: "distance-text", width: 120, id: "distance-text", default_value:  undefined },
    {name: "Mode", field: "mode", width: 120, id: "mode", default_value:  "WALKING" },
    
  ];
}

$(function(){
  // Fill this with your database information.
  // `ddoc_name` is the name of your couchapp project.
  Backbone.couch_connector.config.db_name = database_name;
  Backbone.couch_connector.config.ddoc_name = database_ddoc;
  Backbone.couch_connector.config.view_name = database_view;

  // If set to true, the connector will listen to the changes feed 
  // and will provide your models with real time remote updates.
  Backbone.couch_connector.config.global_changes = false;
  
  // Enables Mustache.js-like templating.
  _.templateSettings = {
    interpolate : /\{\{(.+?)\}\}/g
  };

  window.ItemModel = Backbone.Model.extend({
    initialize : function(){
      var default_values = getAttributesModelDescr();
      for (i in default_values){ 
        var field_name = default_values[i].field;
        var field_value = default_values[i].default_value;
        //console.info("Initializing model attr " + field_name + " with " + field_value);
        if(!this.get(field_name)){
          this.set({field_name: field_value});
        } 
      }
    }
  });
  
  // Now let's define a new Collection of itemsList
  var ItemList = Backbone.Collection.extend({
    model : ItemModel,
    url : "/" + collection_schema
  });
  
  window.itemsList = new ItemList();
  
  var ItemsListView = Backbone.View.extend({
    
    initialize : function(){
      _.bindAll(this, 'refreshed', 'addItem', 'deleted');      
      itemsList.bind("reset", this.refreshed);
      itemsList.bind("add", this.addItem);
      itemsList.bind("remove", this.deleted);
    },

    _update : function(){
    },
    
    _forRouteCalculation : function(latlng){
      waypoints.push({ location: latlng, stopover: true });
    },
    // Prepends an entry row  
    addItem : function(schema){
        var attr = schema.attributes;  
        if (attr.attraction){
            var latlng = new google.maps.LatLng(attr["lat"], attr["lon"], wrap_location);
            var icon = "/__db/_design/media/number_" + markers.length + ".png";
            var shadow = new google.maps.MarkerImage(
                '/__db/_design/media/shadow.png', null, null,
                new google.maps.Point(22, 36)
            );
            this._forRouteCalculation(latlng);
            var m = new google.maps.Marker({
                position: latlng, 
                map: map,
                draggable: map_settings["markers"]["draggable"],
                icon: icon,
                shadow: shadow
            });
            var marker = m;
            google.maps.event.addListener(m, 'click', function(event){
                setSelectedMarker(marker);
            });
            google.maps.event.addListener(m, 'dragend', function(event){
                var mdl = itemsList.get(marker.schema_id);
                mdl.set({"lat": event.latLng.lat(), "lon": event.latLng.lng()});
                setSelectedMarker(marker);
                //mdl.save();
                //console.info("Saving new position");
            });
            
            m.schema_id = schema.id;
            markers.push(m);
            if (this.addItemCallbackSuccess) {this.addItemCallbackSuccess();}
        } else {
        	if (window.path_section_editable_steps && getToggleEditablePathAddState()){
        		addEditablePathMarkerIcon(attr);
        	}
        }
    },
    
    // Renders all table_el into the table
    refreshed : function(){
      this._update();
    },
    
    // can be updates from _changes feed
    deleted : function(){
      this.refreshed();
    },
        
        getByArea : function(area){
            var unsorted_pth = itemsList.filter(function(itm) {
                return (itm.get("area") == area);
            });
            return _.sortBy(unsorted_pth, function(obj){ return obj.get("timestamp"); })
        }, 
        getPathBypath : function(clr){
            var unsorted_pth = itemsList.filter(function(itm) {
                return itm.get("path") == clr;
            });
            return _.sortBy(unsorted_pth, function(obj){ return obj.get("timestamp"); })
        },

        showPathBypath : function(clr){
            var unsorted_pth = itemsList.filter(function(itm) {
                return ((itm.get("path") == clr) && (itm.get("attraction") === false));
            });
            var pth = _.sortBy(unsorted_pth, function(obj){ return obj.get("timestamp"); })
            for (i in pth){
                this.addItem(pth[i]);
            }
        },

        showIconBypath : function(clr){
            var unsorted_pth = itemsList.filter(function(itm) {
                return ((itm.get("path") == clr) && (itm.get("attraction") === true));
            });
            var pth = _.sortBy(unsorted_pth, function(obj){ return obj.get("timestamp"); })
            for (i in pth){
                this.addItem(pth[i]);
            }
        },
        
        getPathByPathAndArea : function(clr, area){
            var unsorted_pth = itemsList.filter(function(itm) {
                return ((itm.get("path") == clr) && (itm.get("area") == area) && (itm.get("attraction") === false));
            });
            return _.sortBy(unsorted_pth, function(obj){ return obj.get("timestamp"); })
        }, 
        
        getByPathAndArea : function(clr, area){
            var unsorted_pth = itemsList.filter(function(itm) {
                return ((itm.get("path") == clr) && (itm.get("area") == area) && (itm.get("attraction") === true));
            });
            return _.sortBy(unsorted_pth, function(obj){ return obj.get("timestamp"); })
        }, 
        
        showIconByPathAndArea : function(clr, area){
            //var unsorted_pth = itemsList.filter(function(itm) {
            //  return ((itm.get("path") == clr) && (itm.get("area") == area) && (itm.get("attraction") === true));
            //});
            var pth = this.getByPathAndArea(clr, area); //_.sortBy(unsorted_pth, function(obj){ return obj.get("timestamp"); })
            for (i in pth){
                this.addItem(pth[i]);
            }
        },
        
        getTrailByPathAndArea : function(clr, area, map, overlays){
            var unsorted_pth = itemsList.filter(function(itm) {
                return ((itm.get("path") == clr) && (itm.get("area") == area) && (itm.get("attraction") === false));
            });
            return _.sortBy(unsorted_pth, function(obj){ return obj.get("timestamp"); })
        },
        
        clearByPathAndArea : function(clr, area){
            var pth = itemsList.filter(function(itm) {
                return ((itm.get("path") == clr)  && (itm.get("area") == area) && (itm.get("attraction") === false));
            });
            console.info("Removing " + pth.length + " items.");
            for (i in pth){
                console.info("Removing item")
                pth[i].destroy();
            }
        },
/*
        clearByPath : function(clr){
            var pth = itemsList.filter(function(itm) {
                return ((itm.get("path") == clr));
            });
            for (i in pth){
                console.info("Removing item")
                pth[i].destroy();
            }
        },

        clearAppPathsByArea : function(area){
            var pth = itemsList.filter(function(itm) {
                return ((itm.get("area") == area) && (itm.get("attraction") === false));
            });
            for (i in pth){
                console.info("Removing item")
                pth[i].destroy();
            }
        },
*/        
        getPathInfo : function (area){
            //pathInfo["yellow"] = {"label":"Gulur", "path":"yellow", "path":[{"waypoint":false,"lat":64.1366,"lon":-21.913520000000002,"distance-text":"0.2 km","distance-value":207,"duration-text":"3 mins","duration-value":156,"descr":"StefniÃ° <b>norÃ°ur</b> Ã¡ moti <b>FlÃ³kagata</b>","mode":"WALKING"},{"waypoint":false,"lat":64.13836,"lon":-21.91224,"distance-text":"0.4 km","distance-value":416,"duration-text":"6 mins","duration-value":380,"descr":"SnuiÃ° <b>hÃ¦gri</b> aÃ° <b>FlÃ³kagata</b>","mode":"WALKING"},{"waypoint":false,"lat":64.13713,"lon":-21.90415,"distance-text":"23 m","distance-value":23,"duration-text":"1 min","duration-value":15,"descr":"SnuiÃ° <b>hÃ¦gri</b> aÃ° <b>StakkahlÃ­Ã°</b> ÃfangastaÃ°ur mun vera Ã¡ hÃ¦gri hÃ¶nd","mode":"WALKING"},{"waypoint":false,"lat":64.13693,"lon":-21.904300000000003,"distance-text":"0.1 km","distance-value":129,"duration-text":"2 mins","duration-value":100,"descr":"StefniÃ° <b>norÃ°ur</b> Ã¡ <b>StakkahlÃ­Ã°</b> Ã¡ moti <b>FlÃ³kagata</b>","mode":"WALKING"},{"waypoint":false,"lat":64.13803,"lon":-21.903460000000003,"distance-text":"0.2 km","distance-value":208,"duration-text":"2 mins","duration-value":131,"descr":"SnuiÃ° <b>vinstri</b> aÃ° <b>HÃ¡teÃ­gsvegur</b>","mode":"WALKING"},{"waypoint":false,"lat":64.13853,"lon":-21.907590000000003,"distance-text":"0.4 km","distance-value":440,"duration-text":"5 mins","duration-value":288,"descr":"SnuiÃ° <b>hÃ¦gri</b> aÃ° <b>NÃ³atÃºn</b>","mode":"WALKING"},{"waypoint":false,"lat":64.14217000000001,"lon":-21.90405,"distance-text":"12 m","distance-value":12,"duration-text":"1 min","duration-value":7,"descr":"StefniÃ° <b>norÃ°uraustur</b> Ã¡ <b>NÃ³atÃºn</b> Ã¡ moti <b>Laugavegur</b>","mode":"WALKING"},{"waypoint":false,"lat":64.14227000000001,"lon":-21.903950000000002,"distance-text":"0.2 km","distance-value":223,"duration-text":"3 mins","duration-value":176,"descr":"SnuiÃ° <b>vinstri</b> aÃ° <b>Laugavegur</b>","mode":"WALKING"},{"waypoint":false,"lat":64.14301,"lon":-21.908240000000003,"distance-text":"0.1 km","distance-value":109,"duration-text":"2 mins","duration-value":110,"descr":"SnuiÃ° <b>vinstri</b> aÃ° <b>Ãsholt</b>","mode":"WALKING"},{"waypoint":false,"lat":64.14204000000001,"lon":-21.908450000000002,"distance-text":"88 m","distance-value":88,"duration-text":"1 min","duration-value":64,"descr":"SnuiÃ° <b>vinstri</b> aÃ° <b>Brautarholt</b>","mode":"WALKING"},{"waypoint":false,"lat":64.14199,"lon":-21.906650000000003,"distance-text":"80 m","distance-value":80,"duration-text":"1 min","duration-value":69,"descr":"SnuiÃ° <b>hÃ¦gri</b> aÃ° <b>TraÃ°arholt</b>","mode":"WALKING"},{"waypoint":false,"lat":64.14128000000001,"lon":-21.906920000000003,"distance-text":"0.2 km","distance-value":201,"duration-text":"2 mins","duration-value":132,"descr":"SnuiÃ° <b>hÃ¦gri</b> aÃ° <b>Skipholt</b>","mode":"WALKING"},{"waypoint":false,"lat":64.14123000000001,"lon":-21.91103,"distance-text":"14 m","distance-value":14,"duration-text":"1 min","duration-value":11,"descr":"SnuiÃ° <b>vinstri</b> aÃ° <b>StÃ³rholt</b>","mode":"WALKING"},{"waypoint":false,"lat":64.14110000000001,"lon":-21.910980000000002,"distance-text":"25 m","distance-value":25,"duration-text":"1 min","duration-value":17,"descr":"SnuiÃ° <b>hÃ¦gri</b> aÃ° <b>Einholt</b> ÃfangastaÃ°ur mun vera Ã¡ vinstri hÃ¶nd","mode":"WALKING"},{"waypoint":false,"lat":64.14099,"lon":-21.911420000000003,"distance-text":"25 m","distance-value":25,"duration-text":"1 min","duration-value":19,"descr":"StefniÃ° <b>norÃ°uraustur</b> Ã¡ <b>Einholt</b> Ã¡ moti <b>StÃ³rholt</b>","mode":"WALKING"},{"waypoint":false,"lat":64.14110000000001,"lon":-21.910980000000002,"distance-text":"0.1 km","distance-value":140,"duration-text":"1 min","duration-value":83,"descr":"SnuiÃ° <b>vinstri</b> aÃ° <b>StÃ³rholt</b>","mode":"WALKING"},{"waypoint":false,"lat":64.14212,"lon":-21.9126,"distance-text":"0.3 km","distance-value":297,"duration-text":"4 mins","duration-value":228,"descr":"SnuiÃ° <b>vinstri</b> aÃ° <b>Ãžverholt</b>","mode":"WALKING"},{"waypoint":false,"lat":64.13953000000001,"lon":-21.914040000000004,"distance-text":"78 m","distance-value":78,"duration-text":"1 min","duration-value":47,"descr":"SnuiÃ° <b>hÃ¦gri</b> aÃ° <b>HÃ¡teigsvegur</b>","mode":"WALKING"},{"waypoint":false,"lat":64.13976000000001,"lon":-21.915570000000002,"distance-text":"33 m","distance-value":33,"duration-text":"1 min","duration-value":23,"descr":"SnuiÃ° <b>vinstri</b> aÃ° <b>RauÃ°arÃ¡rstÃ­gur</b>","mode":"WALKING"},{"waypoint":false,"lat":64.13948,"lon":-21.91582,"distance-text":"0.2 km","distance-value":198,"duration-text":"2 mins","duration-value":146,"descr":"SnuiÃ° <b>hÃ¦gri</b> aÃ° <b>Skeggjagata</b>","mode":"WALKING"},{"waypoint":false,"lat":64.14020000000001,"lon":-21.91956,"distance-text":"0.2 km","distance-value":166,"duration-text":"2 mins","duration-value":115,"descr":"SnuiÃ° <b>hÃ¦gri</b> aÃ° <b>Snorrabraut</b>","mode":"WALKING"},{"waypoint":false,"lat":64.14154,"lon":-21.91806,"distance-text":"0.1 km","distance-value":143,"duration-text":"2 mins","duration-value":147,"descr":"SnuiÃ° <b>vinstri</b> aÃ° <b>BergÃ¾Ã³rugata</b>","mode":"WALKING"},{"waypoint":false,"lat":64.14211,"lon":-21.920720000000003,"distance-text":"64 m","distance-value":64,"duration-text":"1 min","duration-value":55,"descr":"SnuiÃ° <b>vinstri</b> aÃ° <b>BarÃ³nsstÃ­gur</b> ÃfangastaÃ°ur mun vera Ã¡ vinstri hÃ¶nd","mode":"WALKING"},{"waypoint":false,"lat":64.14163,"lon":-21.92141,"distance-text":"0.3 km","distance-value":287,"duration-text":"4 mins","duration-value":239,"descr":"StefniÃ° <b>suÃ°urvestur</b> Ã¡ <b>BarÃ³nsstÃ­gur</b> Ã¡ moti <b>Egilsgata</b> ÃfangastaÃ°ur mun vera Ã¡ hÃ¦gri hÃ¶nd","mode":"WALKING"},{"waypoint":false,"lat":64.14023,"lon":-21.926370000000002,"distance-text":"9 m","distance-value":9,"duration-text":"1 min","duration-value":6,"descr":"StefniÃ° <b>norÃ°uraustur</b> Ã¡ <b>BarÃ³nsstÃ­gur</b> Ã¡ moti <b>EirÃ­ksgata</b>","mode":"WALKING"},{"waypoint":false,"lat":64.14028,"lon":-21.92621,"distance-text":"0.1 km","distance-value":106,"duration-text":"1 min","duration-value":69,"descr":"SnuiÃ° <b>hÃ¦gri</b> aÃ° <b>EirÃ­ksgata</b>","mode":"WALKING"},{"waypoint":false,"lat":64.13946,"lon":-21.92511,"distance-text":"0.1 km","distance-value":99,"duration-text":"1 min","duration-value":71,"descr":"SnuiÃ° <b>hÃ¦gri</b>","mode":"WALKING"},{"waypoint":false,"lat":64.13865,"lon":-21.924580000000002,"distance-text":"93 m","distance-value":93,"duration-text":"1 min","duration-value":63,"descr":"SnuiÃ° <b>hÃ¦gri</b>","mode":"WALKING"}]};
            var labels = {"yellow": "Gulur", "red": "Rauður", "green": "Græn", "blue": "Blár", "purple": "Fjólublár", "orange": "Appelsinugulur"};
            var itms_unsorted = itemsList.filter(function(itm) {
                return (itm.get("area") == area);
            });
            var itms = _.sortBy(itms_unsorted, function(obj){ return obj.get("timestamp"); })
            pathInfo = {};
            for (i in itms){
                var itm = itms[i].attributes;
                if (pathInfo[itm.path] === undefined){
                    pathInfo[itm.path] = {};
                    pathInfo[itm.path]["label"] = labels[itm.path];
                    pathInfo[itm.path]["path"] = itm.path;
                    pathInfo[itm.path]["path"] = [];
                    pathInfo[itm.path]["attraction"] = [];
                }
                if (itm.attraction){
                    pathInfo[itm.path]["attraction"].push(itm);
                } else {
                    pathInfo[itm.path]["path"].push(itm);
                }
            }
            return pathInfo;
        }
  });

  // The App controller initializes the app by calling `itemsList.fetch()`
  window.App = Backbone.Router.extend({
    initialize : function(){
    	if(window.editing_map){
        itemsList.fetch({
            reset: true,
            success: function() {
            	console.log('Loaded all paths from server')
            },
            error: function(e,a) {
                 console.log('Failed to fetch!');
            }
     		}); 	       		
    	} else {
				var id = "attractions2";
				if (hasNetworkConnection()){
					$.ajax({
				    url: '/'+database_name+"/" + id,
				    type: 'GET',
				    success: function(result) {
				    	var preset_paths = JSON.parse(result);
				    	itemsList.reset(preset_paths["path"]); 
				    	localStorageSetItem("map_routes_"+id, JSON.stringify(itemsList.toJSON()));
				    }
					});	
				} else {
      		var map_routes_json = localStorageGetItem("map_routes_"+id);
      		if (map_routes_json){
      			map_routes = JSON.parse(map_routes_json);
      			itemsList.reset(map_routes);
      		}					
				}
    	}
    }
  });
  
  window.itemsListView = new ItemsListView();
  window.app = new App();	
  /*if($.couch){
  	window.app = new App();	
  }else{
		$.getScript( '/_utils/script/jquery.couch.js', function(){
			window.app = new App();
  	});
  } */ 
});

function loadBackboneData(){
		var id = "/attractions2"; 
		$.ajax({
	    url: '/'+database_name+"/" + id,
	    type: 'GET',
	    success: function(result) {
	        // Do something with the result
	        alert("saved");
	    }
	});	
}
