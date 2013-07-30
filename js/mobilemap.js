	String.prototype.format = function() { a = this; for ( k in arguments ) { a = a.replace("{" + k + "}", arguments[k]); } return a; };
	window.demo = { 
		'version': '3.0-rc1',
		'ga': 'UA-17614686-5',
		'primaryUrl': 'http://code.google.com/p/jquery-ui-map/',
		'url': 'http://jquery-ui-map.googlecode.com/', 
		'forum': 'http://groups.google.com/group/jquery-ui-map-discuss/feed/rss_v2_0_msgs.xml', 
		'subscribe': 'http://groups.google.com/group/jquery-ui-map-discuss/boxsubscribe', 
		'exception': 'Unable to load due to either poor internet connection or some CDN\'s aren\'t as responsive as we would like them to be. Try refreshing the page :D.', 
		'init': function() {
			window._gaq = [['_setAccount', this.ga], ['_trackPageview'], ['_trackPageLoadTime']];
			this.test('Backbone', function() {
				$('#forum').append('<h2>Forum</h2><ul id="forum_posts"></ul><h2>Subscribe</h2><form id="forum_subscribe" class="subscribe" action="#"><label for="email">E-mail:</label><input id="email" type="text" name="email" /><input type="submit" name="sub" value="Subscribe" /></form>');
				ForumCollection = Backbone.Collection.extend({ 'url': 'http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&callback=?&q={0}'.format(encodeURIComponent(demo.forum)), 'parse': function(response) { return response.responseData.feed.entries; } });
				ForumPost = Backbone.View.extend({ 'tagName': 'li', 'className': 'group-item', 'template': _.template('<a href="<%=link%>"><%=title%></a></h3>'), 'render': function() { $(this.el).html(this.template(this.model.toJSON())); return this; } }); 
				Forum = Backbone.View.extend({ 'el': $("#forum"), 'initialize': function() { this.col = new ForumCollection(); this.col.bind('reset', this.load, this); this.col.fetch(); }, 'add': function(post) { var view = new ForumPost({'model': post}); $('#forum_posts').append(view.render().el); }, 'load': function () { this.col.each(this.add); $('#forum_subscribe').attr('action', demo.subscribe); $(this.el).show(); } });
				var app = new Forum();
			});
			this.test('prettyPrint', function() { prettyPrint(); });
			$('#version').text(this.version);
		},
		'redirect': function(url) { alert('This page is deprecated. Please update your URL. Redirecting to new page.'); window.location = url; },
		'col': [], 
		'tests': [],
		'test': function(a, b) { if ( window[a] ) { b(); } },
		'add': function(a, b) { if (b) { this.col[a] = b; } else { this.col.push(a); } return this; },
		'load': function(a) { var self = this; if (a) { self.col[a](); } else { $.each(self.col, function(i,d) { try { d(); } catch (err) { alert(self.exception); } }); } },
		'timeStart': function(key, desc) { this.tests[key] = { 'start': new Date().getTime(), 'desc': desc }; },
		'timeEnd': function(key) { this.tests[key].elapsed = new Date().getTime(); },
		'report': function(id) { var i = 1; for ( var k in this.tests ) { var t = this.tests[k]; $(id).append('<div class="benchmark rounded"><div class="benchmark-result lt">' + (t.elapsed - t.start) + ' ms</div><div class="lt"><p class="benchmark-iteration">Benchmark case ' + i + '</p><p class="benchmark-title">' + t.desc + '</p></div></div>'); i++; }; }
	};
	
	window.running_mobile = 1;
	demo.init();

	function addLocation(){
		addItemCallbackPreSend();
		var name = $('#location_name').val();
		var descr = "";
		var area = $.cookie('map_area');
		var path = $.cookie('map_path');
	  	var latlng = window.current_position;
	  	var lat = latlng.lat();
	  	var lng = latlng.lng();
	  	var mrkr = getAttributesModelDescr();
			var values = {};
			var default_values = getAttributesModelDescr();
			for (i in default_values){ 
			      values[default_values[i].field] = default_values[i].default_value;
			}
			if (name === undefined){ name = ""; }
			if (descr === undefined){ descr = ""; }
			values["schema"] = "8";
			values["timestamp"] = new Date().getTime();
			values["lat"] = lat;
			values["lon"] = lng;
			values["path"] = path;
			values["area"] = area
			values["attraction"] = true;
			values["name"] = name;
			values["descr"] = descr;
		  var i = itemsList.create(values);
		
	}
	
	function showAttractionInfo(item_id){
		var itm = itemsList.get(item_id);
		if(itm){
			var info = itm.attributes.content;
			$("#txtAttractionInfo").html(info);
			$.mobile.changePage("#dlgAttractionInfo", { transition: "flip"});
			//setTimeout('$.mobile.defaultPageTransition = "pop";', 1000);
		}
	}