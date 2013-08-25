// http://www.shutterstock.com/pic-104156255/stock-vector-silhouettes-children-walking-outdoor-with-sun-background.html

var FILESYSTEM;

function getMapIDs() {
    /*
     * Return a list of mapIDs or null 
     */
    var mapboxIDs = (localStorage_MAPBOX_IDS_ || "").split(",");
    if (mapboxIDs[0] == "") { return null; } //no ids
    else { return mapboxIDs; }
}

function createMapOptions(clear) {
    return {
        'clear': clear,
        'fileSystem': FILESYSTEM,
        'mapIDs': getMapIDs()
    };
}

function loadMap(){
  window.requestFileSystem(
      LocalFileSystem.PERSISTENT, 0,
      function(fs) { //success
          FILESYSTEM = fs;
          mapUtils.reloadMap(createMapOptions(false));
      },
      function() { alert("Failure accessing filesystem!"); } //filesystem failure
  );
  
  setTimeout(function(){prepLocalDatabase();}, 1000);	
}

$(document).ready(function() {
    //Some bookkeeping code for mapbox id
    /*
    $("#mapbox_id")
    .val(localStorage_MAPBOX_IDS_)
    .off("change")
    .on("change", function() { localStorage_MAPBOX_IDS_ = $(this).val(); });
    */

    //Real page setup on phonegap initialization
    $(document).off("deviceready").on("deviceready", function() {
			loadMap();

				/*
        $("#clear").off("click").on("click", function() {
            localStorageClear();
        });

        $("#download").off("click").on("click", function() {
			    var pos = [64.1404809, -21.9113811];
			    var mapboxIDs = getMapIDs();
			    if (mapboxIDs == null) { alert("Enter a MapBox Map ID"); return; } //no ids
			    fileUtils.bulkDownload(
			       tileUtils.pyramid(mapboxIDs, pos[0], pos[1], {}), //tile urls
			       'tiles',
			       undefined, //$("#progress_modal"),
			       function() {
			           //alert("Download successful!");
			           $.mobile.loading( 'hide');
			           mapUtils.reloadMap(createMapOptions(false));
			       }
			    );
        });
        */
    });
});

function showLoadingAnimation(txt, max_timeout){
	if (window.running_mobile){
		$.mobile.loading( 'show', {
			text: txt,
			textVisible: true,
			theme: 'a',
			html: '' //'<div style="background-color:black;"><span class="ui-icon ui-icon-loading"></span><br> <div id="loading_tile"></div></div>'
		});	
		setTimeout(function(){hideLoadingAnimation();}, max_timeout)
	}
}

function hideLoadingAnimation(){
	if (window.running_mobile){
		$.mobile.loading( 'hide');
	}
}

function prepLocalDatabase(){
	window.localStorageDB = openDatabase('mapdata', '1.0', 'Offline map data', 150 * 1024 * 1024);
	localStorageDB.transaction(function (tx) {
	  tx.executeSql('CREATE TABLE IF NOT EXISTS tiles (id unique, text)', function(){ copyStorageFromSQL2Session(); });
	});
	setTimeout(function(){ if (!window.cache_copied){ copyStorageFromSQL2Session(); }}, 2000);
}

function downloadMapTilesCurrentArea(){
	var pos = [64.1404809, -21.9113811];
	if (hasNetworkConnection()){
		if (window.map_bounds){
			var c = window.map_bounds.getCenter();
			pos = [c.lat, c.lng];
		}
		showLoadingAnimation("Vistar kortið", 120000*2);
		downloadMapTiles(pos);
	} else {
		alert("Þú ert ekki tengdur netið.");
	}
}

function downloadMapTiles(pos){
    var mapboxIDs = ["kajjjak.map-wgrdoudp"];
    fileUtils.bulkDownload(
       tileUtils.pyramid(mapboxIDs, pos[0], pos[1], {}), //tile urls
       'tiles',
       $("#progress_modal"),
       function() {
       		hideLoadingAnimation();
           	mapUtils.reloadMap(createMapOptions(false));
       }
    );
	
}


/////////////
function resizeMap() {
	if(window.running_mobile == true){
		var mapheight = $(window).height()-100;
		var mapwidth = $(window).width()-36;
		$("#map").height(mapheight);
		$("#map").width(mapwidth);
		setTimeout(function(){map.invalidateSize(false);}, 500);
	}
}

MAP_MIN_ZOOM = 17; //16
MAP_MAX_ZOOM = 17;
MAP_DEFAULT_ZOOM = 16; //16
default_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAYAAAAehFoBAAAA4ElEQVRYw+2ZsQkCQRAAD4wEU8ECrMEaHmzC6MoQvg/hmxCE78AaLEAwFYyEdTcweJS/C+TZkQ0mH45nbn8viUgikUI4hP9JOOfskqmE1zThq7IhCYtyVxqSsPFUdiThN3uasHFQZiRh46jMScLGWVmShI1Lbau9CEttq0vCMjHFVnsTLrbao/Boqz0Lf221d+GPVhOEB62mCBs97YRXFOGTsqB8wx2pEi3ppsuUm+6hbCnT2u0X01rMw2ONJQgPGutduCP9NbekzU+mbH6KjfUkXNXY2A+73sDHo0wIA4VfkiVRi8ohOKQAAAAASUVORK5CYII=";
var funcLayer = new L.TileLayer.Functional(function (view) {
    var path = "/kajjjak.map-wgrdoudp/{z}/{y}/{x}.png" 
        .replace('{z}', view.zoom)
        .replace('{x}', view.tile.row)
        .replace('{y}', view.tile.column)
        .replace('{s}', view.subdomain);
    img_base = localStorageGetItem ("/tiles" + path);
    if ((img_base == undefined) || (img_base.length < 10)) {
        if (hasNetworkConnection()){
            console.info ("Loading from server for " + path);
            return "http://api.tiles.mapbox.com/v3" + path;                    
        } else {
            console.info ("Loading default image for " + path);
            return default_image;
        }
    } else {
    	console.info ("Loading cached image for " + path);
        return img_base;
    }
}, {
    subdomains: '1234'
});

function localStorageClearItemsDB(){
	localStorageDB.transaction(function (tx) {tx.executeSql('DELETE FROM tiles WHERE id LIKE "%tile%" ');});
}

function localStorageSetItemDB(k, v){
	localStorageDB.transaction(function (tx) {tx.executeSql('INSERT INTO tiles (id, text) VALUES (?, ?)', [k, v]);});
	//localStorageDB.transaction(function (tx) {tx.executeSql('UPDATE tiles WHERE id="'+k+'" SET VALUES (text, "'+v+'")');});
}

function copyStorageFromSQL2Session(){
	window.cache_copied = true;
	localStorageDB.transaction(function (tx) {
		tx.executeSql('SELECT * FROM tiles', [], function (tx, results) {
		  var len = results.rows.length, i;
		  for (i = 0; i < len; i++) {
		  	var k = results.rows.item(i).id;
		  	var v = results.rows.item(i).text;
		    console.info(v);
		    sessionStorage.setItem(k, v)
		  }
		});	
	});	
}

function localStorageSetItem(k, v){
    try{
        localStorage.setItem(k, v);
    } catch(e) {
        try{
        	localStorageSetItemDB(k, v); //for our offline backup
            sessionStorage.setItem(k, v);
        } catch(e) {
            console.info("Cache is full");
        }
    }
}

function localStorageGetItem(k, default_value){
    var v = localStorage.getItem(k);
    if(v && (v.length > 10)) return v;
    v = sessionStorage.getItem(k);
    if(v) return v;
    return default_value;
}

function localStorageClear(){
	if (localStorage.getItem("map_routes")){ window.map_routes_cache = localStorage.getItem("map_routes"); }
    localStorage.clear();
    sessionStorage.clear();
    localStorageClearItemsDB();
    if (window.map_routes_cache){ localStorage.setItem("map_routes", window.map_routes_cache); }
}        

function LocalFileSystem () {
    this.PERSISTENT = 1;
    this.root = {
        fullPath: ""
    }
}

function requestFileSystem(fs_type, fs_val, fs_success){
    fs = new LocalFileSystem();
    fs_success(fs);
}

function fixHolesInDownload(){
    for(var i in localStorage){
        var u = i;
        var v = localStorage[i];
        if ((u[0] == "/") && (v.length < 10)){
            var url_source = u.replace("/tiles/", "http://api.tiles.mapbox.com/v3/");
            var url_target = u;
            console.info("Found tile " + url_source);
            var f = getEncodeedExternalImage(url_source, url_target);
            localStorageSetItem(url_target, f);
        }
    }
}

function getEncodeedExternalImage(url, url_target) {
    //http://planet.jboss.org/post/using_html5_and_canvas_to_base64_and_cache_public_images
    var img = new Image(); // width, height values are optional params
    //http://blog.chromium.org/2011/07/using-cross-domain-images-in-webgl-and.html
    //remote server has to support CORS
    img.crossOrigin = '';
    img.src = url;
    img.onload = function() {
        if(img.complete){
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height; 
            // Copy the image contents to the canvas
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0,0);
            try {
                localStorageSetItem(url_target, ctx.canvas.toDataURL("image/png"));                                        
            } catch(err) { console.info ("Exceeding quota"); }
        }
    }
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height; 
    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0,0);
    //img.src = ctx.canvas.toDataURL("image/png");
    //return img;
    return ctx.canvas.toDataURL("image/png");
}

function FileTransfer () {
    this.download = function (url_source, url_target, success_fn, failure_fn){ 
        var f = getEncodeedExternalImage(url_source, url_target);
        console.info("Cachine tile ("+url_target+") " + f);
        try{
            localStorageSetItem(url_target, f);
        } catch (err){ console.info ("Exceeding quota"); }
        success_fn(f);
    }
}