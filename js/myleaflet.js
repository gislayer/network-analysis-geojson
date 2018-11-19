var networkAnalysis = null;
var center = [38.42278, 27.13636];
var map = L.map('map').setView(center, 17);
var globalBaseMap = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    attribution: 'GeoJSON Network Analysis | <a href="http://www.portfolio.alikilic.org">Ali KILIÇ | Sr. GIS Developer</a>',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
}).addTo(map);

var dijkstraPath = new L.GeoJSON(null, {
    onEachFeature: onEachFeature,
    style:{color:"orange",weight:5}
}).addTo(map);

var sampleData = new L.GeoJSON(sampleGeoJSON, {
    onEachFeature: onEachFeature,
    style:{color:"black",weight:5,opacity:0.5}
}).addTo(map);

var fullSnapPipeLine = new L.GeoJSON(null, {
    onEachFeature: onEachFeature,
    style:{color:"green",weight:5}
}).addTo(map);



var UnSnapPipeLine = new L.GeoJSON(null, {
    onEachFeature: onEachFeature,
    style:{color:"red",weight:5}
}).addTo(map);

var selectedPipeLine = new L.GeoJSON(null, {
    onEachFeature: onEachFeature
}).addTo(map);

var direction = {start:0,finish:0};
function onEachFeature(feature, layer) {
    debugger;
    if(typeof feature.properties["id"]!=="undefined"){
        layer.bindTooltip("Pipeline ID : "+feature.properties.id);
        layer.bindPopup('<button class="btn btn-success btn-xs" onclick="setStart('+feature.properties.id+');">Set Start</button><button onclick="setFinish('+feature.properties.id+');" class="btn btn-danger btn-xs">Set Finish</button>');
    }else{
        layer.bindTooltip("It's haven't id property");
    }
    layer.on("mouseover",function(e){
        debugger;
        var style = e.target.options.style;
        e.target.featureStyle=Object.assign({},style);
        e.target.setStyle({color:"purple"});
    });
    layer.on("mouseout",function(e){
        debugger;
        e.target.setStyle(e.target.featureStyle);
    });
    
}

function setStart(id){
    direction.start=id;
}

function setFinish(id){
    if(networkAnalysis!==null){
        direction.finish=id;
        if(direction.start!==0){
            var path = networkAnalysis.getDijkstraGeoJSON(direction.start,direction.finish);
            dijkstraPath.clearLayers();
            dijkstraPath.addData(path);
            var bounds = dijkstraPath.getBounds();
            map.fitBounds(bounds);
        }
    }else{
        alert("You must click to start network analysis");
    }
    
}

var features = {
    Poly: {},
    Rectangle: {},
    Line: {},
    Marker: {},
    Circle: {}
};

var options = {
    position: 'topright',
    drawMarker: false,
    drawPolyline: true,
    drawRectangle: false,
    drawPolygon: false,
    drawCircle: false,
    cutPolygon: false,
    editMode: true,
    removalMode: true
};
map.pm.addControls(options);

map.on('pm:create', function (e) {
    var tip = e.shape;
    var f = e.layer;
    e.layer.shape = e.shape;
    var lid = f._leaflet_id;
    f.bindTooltip("Feature ID : "+lid);
    features[tip][lid] = f;
    features[tip][lid].on('click', function (a) {
        debugger;
    });
    var geoj = features[tip][lid].toGeoJSON();
    features[tip][lid].setStyle({color:"black", opacity:0.5,weight:5});
    geoj.properties["id"] = lid;
    sampleGeoJSON.features.push(geoj);
});


function startNetworkAnalysis(){
    networkAnalysis = new geojsonNetworkAnalysis(sampleGeoJSON, { propertyColumn: "id",indexZoomLevel:16});
    networkAnalysis.setIndexLevel(14);
    networkAnalysis.init();
}

function showSnapedLines(){
    debugger;
    var geojson = networkAnalysis.getAllSnappedFeature();
    fullSnapPipeLine.clearLayers();
    fullSnapPipeLine.addData(geojson);
    var bounds = fullSnapPipeLine.getBounds();
    map.fitBounds(bounds);
}

function showUnSnapedLines(){
    var geojson = networkAnalysis.getUnSnappedFeature();
    UnSnapPipeLine.clearLayers();
    UnSnapPipeLine.addData(geojson);
    var bounds = UnSnapPipeLine.getBounds();
    map.fitBounds(bounds);
}