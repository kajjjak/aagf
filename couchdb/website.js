function(doc, req){

	var Mustache = require('vendor/codewip/lib/mustache.js');
	if (!doc || doc.type != "article") {return "404 " + JSON.stringify(doc);} //{return {"code": 302, "body": "See other", "headers": {"Location": "/"}};}
	var map_content = "";
	if (doc.map){
	    doc["map_content"] = Mustache.to_html(this.templates.website_map, doc);
	}
	
	var is_admin = false;
	var admin_tools = "";
	//if (req.userCtx.roles.indexOf("_admin") > -1){ is_admin = true; }
	if (req.userCtx.roles.indexOf("author") > -1){ is_admin = true; }
	if (is_admin){
	    doc["admin_tools"] = Mustache.to_html(this.templates.website_editor, doc);
	}
	return Mustache.to_html(this.templates.website, doc);
}