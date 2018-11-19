class geojsonNetworkAnalysis {

    constructor(geojson, options) {
        this.featuresCount = this.featureCollectionControl(geojson) || 0;
        this.propertyColumn = options["propertyColumn"] || "myid";
        this.dataFilter = options["dataFilter"] || [];
        this.indexZoomLevel = options["indexZoomLevel"] || 16;
        this.featureCollcetion = this.loadFeatureCollection(geojson);
        this.indexGeojson = {};
        this.snapRelation = {};
        this.graph = [];
        this.snappedFeatures = [];
        $("#dis1").removeAttr('disabled');
        $("#dis2").removeAttr('disabled');
        alert('There are '+this.featuresCount+' Feature on the map. You can show snapped lines. Please Click to Button.');
    }

    init() {
        this.indexGeojson = {};
        this.snapRelation = {};
        this.graph = [];
        this.indexGeojson = this.indexing(this.featureCollcetion);
        this.snapRelation = this.indexSnapRelation(this.indexGeojson);
        this.graph = this.reletionOfLines(this.snapRelation);
        return this;
    }

    remove() {
        this.featuresCount = 0;
        this.propertyColumn = "myid";
        this.dataFilter = [];
        this.indexZoomLevel = 16;
        this.featureCollcetion = {};
        this.indexGeojson = {};
        this.snapRelation = {};
        this.graph = [];
        this.snappedFeatures = [];
    }

    getDataFilter(){
        return this.dataFilter;
    }

    setDataFilter(filter){
        this.dataFilter = filter;
        return this;
    }

    getIndexLevel() {
        return this.indexZoomLevel;
    }

    setIndexLevel(prop) {
        this.indexZoomLevel = prop || 16;
        return this;
    }

    setPropertColumn(prop) {
        this.propertyColumn = prop || "myid";
        return this;
    }

    setGeoJSON(newGeoJSON) {
        this.featureCollcetion = {};
        this.featureCollcetion = this.loadFeatureCollection(newGeoJSON);
        return this;
    }

    getCoordinates(id) {
        return typeof this.snapRelation[id] !== "undefined" ? this.snapRelation[id].coordinates : [];
    }

    getGeoJSON(id) {
        return typeof this.snapRelation[id] !== "undefined" ? this.snapRelation[id] : {};
    }

    getFeatureCount() {
        return this.featuresCount;
    }

    getDijkstraGeoJSON(s, f) {
        s = s + '-0';
        f = f + '-' + this.snapRelation[f].coordinates.length - 1;
        var result = this.dijkstra(s, f);
        var coordinates = [];
        var idindex = s.split('-');
        coordinates.push(this.snapRelation[idindex[0]].coordinates[idindex[1]]);
        if (result.status) {
            var dist = result.distance;
            for (var i = 0; i < result.path.length; i++) {
                var nextp = result.path[i];
                var idindex2 = nextp.split('-');
                coordinates.push(this.snapRelation[idindex2[0]].coordinates[idindex2[1]]);
            }
        }
        var featureGeojson = {
            type: "FeatureCollection",
            features: []
        };
        var geojson = {
            type: "Feature",
            properties: {},
            geometry: {
                type: "LineString",
                coordinates: coordinates
            }
        };
        featureGeojson.features.push(geojson);
        return featureGeojson;
    }

    dijkstra(s, f) {
        var graph = this.graph;
        var solutions = {};
        solutions[s] = [];
        solutions[s].dist = 0;
        while (true) {
            var parent = null;
            var nearest = null;
            var dist = Infinity;
            for (var n in solutions) {
                if (!solutions[n])
                    continue
                var ndist = solutions[n].dist;
                var adj = graph[n];
                for (var a in adj) {
                    if (solutions[a])
                        continue;
                    var d = adj[a] + ndist;
                    if (d < dist) {
                        parent = solutions[n];
                        nearest = a;
                        dist = d;
                    }
                }
            }
            if (dist === Infinity) {
                break;
            }
            solutions[nearest] = parent.concat(nearest);
            solutions[nearest].dist = dist;
        }
        var finish = solutions[f];
        if (typeof finish !== "undefined") {
            return { path: finish, distance: finish.dist, status: true };
        } else {
            console.log("Start : " + s + " - Finish : " + f + " : There is No Path");
            return { path: [], distance: 0, status: false };
        }
    }

    reletionOfLines(snapRelation) {
        var firstGraph = [];
        for (var i in snapRelation) {
            var rel = snapRelation[i];
            var lineid = rel.id;
            var coords = rel.coordinates;
            for (var j = 0; j < coords.length - 1; j++) {
                var j2 = j + 1;
                var stcord = coords[j];
                var fncord = coords[j2];
                var dist = map.distance(stcord, fncord);
                var firstname = lineid + '-' + j;
                var newname = lineid + '-' + j2;
                firstGraph.push({ start: firstname, finish: newname, distance: dist });
                if (rel.snap.length > 0) {
                    for (var k in rel.snap) {
                        if (fncord[0] == rel.snap[k].coordinates[0] && fncord[1] == rel.snap[k].coordinates[1]) {
                            var id2 = rel.snap[k].id;
                            var ind = rel.snap[k].index;
                            firstGraph.push({ start: newname, finish: id2 + '-' + ind, distance: 0.001 });
                            break;
                        }

                    }
                }
            }
        }

        var graph = this.readyGraph(firstGraph);
        return graph;
    }

    readyGraph(paths) {
        var graph = {};
        for (var i in paths) {
            var path = paths[i];
            var start = path["start"];
            var finish = path["finish"];
            var distance = path["distance"];
            if (typeof graph[start] == "undefined") {
                graph[start] = {};
                graph[start][finish] = distance;
            } else {
                graph[start][finish] = distance;
            }
            if (typeof graph[finish] == "undefined") {
                graph[finish] = {};
                graph[finish][start] = distance;
            } else {
                graph[finish][start] = distance;
            }
        }
        return graph;
    }

    featureCollectionControl(geojson) {
        if (typeof geojson !== "undefined") {
            if (geojson.type == "FeatureCollection") {
                console.log("There are " + geojson.features.length + " feature in the GeoJSON Data");
                return geojson.features.length;
            } else {
                console.log("Error : Your GeoJSON data's type is not FeatureCollection");
                return 0;
            }
        } else {
            console.log("Error : geojsonNetworkAnalysis Class need to geojson parameters.");
            return 0;
        }
    }

    loadFeatureCollection(geojson) {
        const featureClass = {};
        var propertyColumn = this.propertyColumn;
        geojson.features.map(function (item) {
            var idColumn = item.properties[propertyColumn];
            if (idColumn !== "undefined") {
                featureClass[idColumn] = item;
            }
        });
        return featureClass;
    }

    indexing(features) {
        var index = {};
        var sayi1 = 0;
        var generalTiles = [];
        for (var i in features) {
            var part = features[i];
            if (this.dataFilterFeature(part, this.dataFilter)) {
                var coordslocal = [];
                switch (part.geometry.type) {
                    case "GeometryCollection":
                        coordslocal = part.geometry.geometries[0].coordinates;
                        break;
                    case "MultiLineString":
                        coordslocal = part.geometry.coordinates[0];
                        break;
                    case "LineString":
                        coordslocal = part.geometry.coordinates;
                        break;
                }
                var tileindexarr = [];
                for (var cn = 0; cn < coordslocal.length; cn++) {
                    var tile = this.latlng2tile({ lat: coordslocal[cn][1], lng: coordslocal[cn][0] }, this.indexZoomLevel);
                    var tilename = "x" + tile.x + "y" + tile.y;
                    if (generalTiles.indexOf(tilename) == -1) {
                        sayi1++;
                        console.log("Created : " + sayi1 + ". İndex : " + tilename);
                        generalTiles.push(tilename);
                        tileindexarr.push(tilename);
                        index[tilename] = {
                            x: tile.x,
                            num: sayi1,
                            y: tile.y,
                            idarr: [i],
                            features: [part]
                        }
                    } else {
                        if (tileindexarr.indexOf(tilename) == -1) {
                            tileindexarr.push(tilename);
                            index[tilename].idarr.push(i);
                            index[tilename].features.push(part);
                        } else {
                            if (index[tilename].idarr.indexOf(i) == -1) {
                                index[tilename].idarr.push(i);
                                index[tilename].features.push(part);
                            }
                        }
                    }
                }
            }
        }
        return index;
    }

    indexSnapRelation(indexGeojson) {
        var snapRelation = {};
        var pc = this.propertyColumn;
        for (var i in indexGeojson) {
            var geojsonArray = {};
            var index = indexGeojson[i];
            const { x, y, num } = index;
            var featurearr = [];
            for (var k = -1; k < 2; k++) {
                for (var z = -1; z < 2; z++) {
                    var arr = typeof indexGeojson["x" + (x + z - 1) + "y" + (y + k - 1)] !== "undefined" ? indexGeojson["x" + (x + z - 1) + "y" + (y + k - 1)].features : [];
                    arr.map(function (a) {
                        var id = a.properties[pc];
                        var type = a.geometry.type;
                        if (type == "GeometryCollection") {
                            var geomt = a.geometry.geometries;
                            for (var xii = 0; xii < geomt.length; xii++) {
                                var geomms = a.geometry.geometries[xii];
                                var cood = geomms.coordinates;
                                var types = geomms.type;
                                if (typeof geojsonArray[id] == "undefined") {
                                    geojsonArray[id] = { id: id, snap: [], coordinates: cood };
                                }
                            }
                        } else {
                            if (type == "MultiLineString") {
                                coords = a.geometry.coordinates[0];
                            }
                            if (type == "LineString") {
                                coords = a.geometry.coordinates;
                            }
                            if (typeof geojsonArray[id] == "undefined") {
                                geojsonArray[id] = { id: id, snap: [], coordinates: coords };
                            }
                        }
                    });
                }
            }

            var centerJSON = {};
            for (var c in index.features) {
                var json = index.features[c];
                var id = json.properties[pc];
                var types = json.geometry.type;
                if (types == "GeometryCollection") {
                    var coords = json.geometry.geometries[0].coordinates;
                } else {
                    if (types == "MultiLineString") {
                        coords = json.geometry.coordinates[0];
                    }
                    if (types == "LineString") {
                        coords = json.geometry.coordinates;
                    }
                }
                if (typeof centerJSON[id] == "undefined") {
                    centerJSON[id] = { id: id, snap: [], coordinates: coords };
                }
            }
            var allcoord = this.searchSnapRelation(geojsonArray, centerJSON);
            for (i in allcoord) {
                if (typeof snapRelation[i] == "undefined") {
                    snapRelation[i] = allcoord[i];
                } else {
                    allcoord[i].snap.map(function (e) {
                        snapRelation[i].snap.push(e);
                    });
                }
            }
            console.log("Finished " + num + ". index Relation");
        }
        console.log("Everything is OK!..");
        return snapRelation;
    }

    searchSnapRelation(geojsonObj, searchJson) {
        for (var y in searchJson) {
            var item = searchJson[y];
            var coordinates = item.coordinates;
            var id = item.id;
            var ai = 0;
            for (var i = 0; i < coordinates.length; i++) {
                var coord1 = coordinates[i][0];
                var coord2 = coordinates[i][1];
                for (var z in geojsonObj) {
                    var search = geojsonObj[z];
                    var searchid = search.id;
                    var coordsearch = search.coordinates;
                    if (id !== searchid) {
                        var aj = 0;
                        for (var j = 0; j < coordsearch.length; j++) {
                            var coord1s = coordsearch[j][0];
                            var coord2s = coordsearch[j][1];
                            var fark1 = Math.abs(coord1s-coord1);
                            var fark2 = Math.abs(coord2s-coord2);

                            if ((coord1 == coord1s && coord2s == coord2) || (fark1<=0.00005 && fark2<=0.00005)) {
                                item.snap.push({ id: searchid, index: j, coordinates: [coord1s, coord2s] });
                            }
                        }
                        aj++;
                    }
                };
                ai++;
            }
        }
        return searchJson;
    };

    getSnapFeature(id) {
        this.snappedFeatures = [];
        this.findSnappedByFeatureID(id);
        var geojson = this.idArrayToGeoJSON(this.snappedFeatures);
    }

    getAllSnappedFeature(){
        var snapRelation = this.snapRelation;
        var ciktiGeojson = {
            type: "FeatureCollection",
            features: []
        };
        for(var i in snapRelation){
            if(snapRelation[i].snap.length>0){
                var sampleGeojson = {type: "Feature",properties: {id:i},geometry: {type: "LineString",coordinates:snapRelation[i].coordinates}};
                ciktiGeojson.features.push(sampleGeojson);
            }
        }
        return ciktiGeojson;
    }

    getUnSnappedFeature(){
        debugger;
        var snapRelation = this.snapRelation;
        var ciktiGeojson = {
            type: "FeatureCollection",
            features: []
        };
        for(var i in snapRelation){
            if(snapRelation[i].snap.length==0){
                var sampleGeojson = {type: "Feature",properties: {id:i},geometry: {type: "LineString",coordinates:snapRelation[i].coordinates}};
                ciktiGeojson.features.push(sampleGeojson);
            }
        }
        return ciktiGeojson;
    }

    idArrayToGeoJSON(arr) {
        var geojson = {
            type: "FeatureCollection",
            features: []
        };
        var t = this;
        arr.map(function (item) {
            geojson.features.push(t.featureCollcetion[item]);
        });
        return geojson;
    }

    findSnappedByFeatureID(id) {
        var jsonpart = this.featureCollcetion[id];
        if (typeof jsonpart !== "undefined") {
            var dataFilterStatus = this.dataFilterFeature(jsonpart, this.showFilter);
            if (dataFilterStatus) {
                this.snappedFeatures.push(id);
                var startJson = typeof this.snapRelation[id] == "undefined" ? { snap: [] } : this.snapRelation[id];
                if (startJson.snap.length > 0) {
                    for (var i = 0; i < startJson.snap.length; i++) {
                        var snap = startJson.snap[i];
                        if (this.snappedFeatures.indexOf(snap.id) == -1) {
                            this.findSnappedByFeatureID(snap.id);
                        }
                    }
                }
            }
        }
    };

    latlng2tile(coordinate, zoom) {
        const { lat, lng } = coordinate;
        var tilex = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
        var tiley = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
        return { x: tilex, y: tiley };
    }

    dataFilterFeature(feature, filter) {
        var status = true;
        for (var i = 0; i < filter.length; i++) {
            const { prop, filter } = filter[i]
            if (filter.indexOf(typeof feature.properties[prop] !== "undefined" ? feature.properties[prop] : null) >= 0) {
                status = false;
            }
        }
        return status;
    }
}


