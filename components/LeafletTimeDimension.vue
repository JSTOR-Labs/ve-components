<template>
  <div id="map" :style="containerStyle"></div>
</template>

<script>
/* global L, _, moment */

const dependencies = [
    'https://cdn.jsdelivr.net/npm/leaflet@1.5.1/dist/leaflet.css',
    'https://cdn.jsdelivr.net/npm/leaflet-timedimension@1.1.1/dist/leaflet.timedimension.control.min.css',
    'https://cdn.jsdelivr.net/npm/leaflet@1.5.1/dist/leaflet.js',
    'https://cdn.jsdelivr.net/npm/iso8601-js-period@0.2.1/iso8601.min.js',
    'https://cdn.jsdelivr.net/npm/leaflet-timedimension@1.1.1/dist/leaflet.timedimension.min.js',
    'https://cdn.jsdelivr.net/npm/moment@2.27.0/moment.min.js',
    'https://jstor-labs.github.io/ve-components/public/js/L.Control.Opacity.js',
    'https://jstor-labs.github.io/ve-components/public/js/leaflet-fa-markers.js'
]

// Some leaflet baselayers
const baseLayers = {
    'OpenStreetMap': ['https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            { maxZoom: 18, attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' }],
    'OpenTopoMap': ['https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            { maxZoom: 17, attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)' }],
    'Stamen_Watercolor': ['https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}',
            {	subdomains: 'abcd', minZoom: 1, maxZoom: 16, ext: 'jpg', attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }],
    'Stamen_TerrainBackground': ['https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-background/{z}/{x}/{y}{r}.{ext}',
            { attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', subdomains: 'abcd', minZoom: 0, maxZoom: 18, ext: 'png'}],
    'Stadia_AlidadeSmooth': ['https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
            { attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',  maxZoom: 20 }],
    'Stadia_AlidadeSmoothDark': ['https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
            { attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors', maxZoom: 20 }],
    'Esri_WorldPhysical': ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}', 
            { maxZoom: 8, attribution: 'Tiles &copy; Esri &mdash; Source: US National Park Service' }],
    'Esri_WorldGrayCanvas': ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
            { attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ', maxZoom: 16 }],
    'Esri_NatGeoWorldMap': ['https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
            { attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC', maxZoom: 16 }]
}

const iconMap = {
  garden: 'leaf'
}

const defaults = {
    // Leaflet Map options
        basemap: 'OpenStreetMap',
        center: [25, 0],
        zoom: 2.5,
        maxZoom: 16,
    // Leaflet.TimeDimension options: see https://github.com/socib/Leaflet.TimeDimension
        timeDimension: false,
        autoPlay: false,
        loop: false,
        fps: 1,
        timeInterval: '/P1Y', // see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
        period: 'P1Y',
        duration: 'P1Y', // see https://en.wikipedia.org/wiki/ISO_8601#Durations
        autoFit: false,
        dateFormat: 'YYYY-MM-DD', // refer to https://momentjs.com/docs/#/displaying/
    // other defaults
      popupOptions: { autoClose: false, closeButton: false, closeOnClick: false }
}

module.exports = {
    name: "LeafletTimeDimension",
    props: {
        items: { type: Array, default: () => ([]) },
        itemsInActiveElements: { type: Array, default: () => ([]) },
        actions: { type: Array, default: () => ([]) },
        actionSources: { type: Array, default: () => ([]) },
        width: Number,
        height: Number,
        activeElement: String,
        hoverItemID: String,
        selectedItemID: String
    },
    data: () => ({
        map: undefined,
        popups: {},
        labelsLayer: undefined,
        features: [],
        geoJSONLayers: [],
        tileLayers: [],
        timeDimensionControl: undefined,
        controls: {
            timeDimension: undefined,
            layers: undefined,
            opacity: undefined
        }
    }),
    computed: {
        item() { return this.items.length > 0 ? this.items[0] : {} },
        mapDef() { return this.item.layers ? this.item : {...this.item, ...{layers: []}} },
        showLabels() { return this.mapDef['show-labels'] && this.mapDef['show-labels'] !== 'false' },
        preferGeoJSON() { return this.mapDef['prefer-geojson'] && this.mapDef['prefer-geojson'] !== 'false' },
        isSelected() { return this.selected === 'mapViewer' },
        data() { return this.mapDef.data },
        basemap() { return this.mapDef.basemap || defaults.basemap },
        center() { return this.mapDef.center || defaults.center },
        zoom() { return this.mapDef.zoom || defaults.zoom },
        maxZoom() { return this.mapDef['max-zoom'] || defaults.maxZoom },
        timeDimension() { return this.mapDef['time-dimension'] === 'true' || defaults.timeDimension },
        autoPlay() { return this.mapDef['auto-play'] === 'true' || defaults.autoPlay },
        loop() { return this.mapDef.loop === 'true' || defaults.loop },
        fps() { return this.mapDef.fps || defaults.fps },
        timeInterval() { return this.mapDef['time-interval'] || defaults.timeInterval },
        period() { return this.mapDef.period || defaults.period },
        duration() { return this.mapDef.duration || defaults.duration },
        autoFit() { return this.mapDef['auto-fit'] === 'true' || defaults.autoFit },
        dateFormat() { return this.mapDef['date-format'] || defaults.dateFormat },
        containerStyle() {
            return {
                width: `${this.width}px`,
                height: `${this.height}px`,
                overflowY: 'auto !important',
                marginLeft: '0',
            }
        }
  },
  mounted() {
        this.loadDependencies(dependencies, 0, this.init)
  },
  methods: {
        init() {
            console.log(this.$options.name, this.mapDef)
            this.createMap()
            this.syncLayers()
        },
        createMap(reload) {
            if (reload && this.map) {
                this.map.off()
                this.map.remove()
                this.map = undefined
            }
            if (!this.map) {
                // this.labelsLayer = L.layerGroup()
                // this.baseLayer = L.tileLayer(...baseLayers[this.basemap])
                this.tileLayers.basemap = this.basemap
                this.map = L.map('map', {
                    center: this.center,
                    zoom: this.zoom,
                    zoomSnap: 0.1,
                    maxZoom: this.maxZoom,
                    fullscreenControl: true,
                    preferCanvas: false
                })
                if (this.timeDimension) this.addTimeDimension()
                this.map.on('moveend', e => {
                    console.log('moveend', e)
                    console.log(this.map.getBounds().getCenter())
                })
                this.map.on('layeradd', e => {
                    if (e.layer.feature) {
                        if (e.layer.feature) {
                            if (e.layer.feature.properties.label) {
                                const featureType = e.layer.feature.geometry.type
                                const latLng = featureType === 'Polygon' || featureType === 'MultiPolygon' || featureType === 'LineString'
                                    ? e.layer.getBounds().getCenter()
                                    : e.layer.getLatLng()
                                const labelOffset = e.layer.feature.properties['marker-type'] === 'circle' ? -6 : -30
                                this.addPopup(e.layer.feature.properties.qid || e.layer.feature.properties.id, e.layer.feature.properties.label, latLng, labelOffset)
                            }
                            this.features.push(e.layer.feature)
                            this.layersUpdated()
                        }
                    }
                })
            }
        },
        addTimeDimension() {
            // console.log(`timeDimension: timeInterval=${this.timeInterval} period=${this.period} loop=${this.loop} autoPlay=${this.autoPlay} transitionTime=${1000/this.fps}`)
            let timeDimension = new L.TimeDimension({
                // times: [],
                timeInterval: this.timeInterval,
                timeDimensionControl: true,
                period: this.period,
                // validTimeRange: undefined,
                // currentTime: undefined
            })
            this.map.timeDimension = timeDimension

            let player = new L.TimeDimension.Player({
                transitionTime: 1000/this.fps,
                loop:           this.loop,
                startOver:      true
            }, timeDimension)

            let timeDimensionControlOptions = {
                timeSliderDragUpdate: true,
                loopButton:    true,
                autoPlay:      this.autoPlay,
                player:        player,
                timeDimension: timeDimension,
                position:      'bottomleft',
                minSpeed:      1,
                speedStep:     0.5,
                maxSpeed:      15
            }

            this.controls.timeDimension = new L.Control.TimeDimension(timeDimensionControlOptions)
            // override L.Control.TimeDimension_getDisplayDateFormat for custom date formatting
            this.controls.timeDimension._getDisplayDateFormat = (date) => {
                return moment(date).format(this.dateFormat)
            }
            this.map.addControl(this.controls.timeDimension)
        },
        removeTimeDimension() {
            if (this.map.timeDimension) {
                this.map.removeControl(this.controls.timeDimension)
                this.map.timeDimension = undefined
                this.controls.timeDimension = undefined
            }
        },
        syncLayers() {
            this.syncGeoJSONLayers()
            this.syncTileLayers()
            this.map.flyTo(this.mapDef.center || defaults.center, this.mapDef.zoom || defaults.zoom)
        },
        syncTileLayers() {
            const mapDefs = {}
            this.mapDef.layers.filter(layerDef => layerDef.type === 'mapwarper').forEach(layerDef => mapDefs[layerDef['mapwarper-id']] = layerDef)
            
            const next = []
            if (this.tileLayers.length > 0 && this.tileLayers[0].id === this.basemap) {
                next.push(this.tileLayers[0])
                this.tileLayers.slice(1).forEach(layer => {
                    if (mapDefs[layer.id]) {
                        next.push(layer)
                    } else {
                        this.map.removeLayer(layer.layer)
                    }
                })
            } else {
                this.tileLayers.forEach(layer => {
                    this.map.removeLayer(layer.layer)
                })
                const baseLayer = L.tileLayer(...baseLayers[this.basemap])
                this.map.addLayer(baseLayer)
                next.push({id: this.basemap, label: this.basemap, layer: baseLayer})
            }

            for (let [layerId, layerDef] of Object.entries(mapDefs)) {
                const exists = next.find(layer => layer.id === layerId)
                if (!exists) {
                    const layer = L.tileLayer(`https://mapwarper.net/maps/tile/${layerDef['mapwarper-id']}/{z}/{x}/{y}.png`)
                    next.push({id: layerId, label: layerDef.label || layerDef.title, layer})
                    layer.options.id = layerDef.id
                    layer.options.label = layerDef.label || layerDef.title
                    layer.options.type = 'mapwarper'
                    if (layerDef.active) layer.addTo(this.map)
                }
            }

            if (this.controls.layers) this.map.removeControl(this.controls.layers)
            if (this.controls.opacity) this.map.removeControl(this.controls.opacity)

            if (next.length > 1) {
                const layers = {}
                next.slice(1).forEach(layer => layers[layer.label] = layer.layer)
                this.controls.layers = L.control.layers(
                    {}, // baseLayers,
                    layers, 
                    { collapsed: true } //options
                ).addTo(this.map)
                this.controls.opacity = L.control.opacity(layers, { collapsed: true }).addTo(this.map)
            } 
            this.tileLayers = next
        },
        syncGeoJSONLayers() {
            this.geoJSONLayers.forEach(layer => this.map.removeLayer(layer))
            Object.values(this.popups).forEach(popup => this.map.closePopup(popup))
            if (this.mapDef.data) {
                this.getGeoJSON(this.mapDef.data)
                .then(geoJSON => this.addGeoJSONLayer(geoJSON))
            } else {
                if (this.mapDef.layers) {
                    const geoJSONLayerDefs = this.mapDef.layers
                        .filter(layerDef => layerDef.geojson || layerDef.url)
                        // .map(layerDef => layerDef.geojson || layerDef.url)
                    geoJSONLayerDefs.forEach(layerDef => {
                        this.getGeoJSON(layerDef.geojson || layerDef.url)
                        .then(geoJSON => this.addGeoJSONLayer(geoJSON,layerDef))
                    })
                }
                const itemsWithCoords = this.itemsInActiveElements
                    .filter(item => item.coords !== undefined && !(item.geojson && this.preferGeoJSON))
                if (itemsWithCoords.length > 0) {
                    this.addGeoJSONLayer(this.itemsWithCoordsToGeoJSON(itemsWithCoords))
                }
                if (this.preferGeoJSON) {
                    this.itemsInActiveElements
                    .filter(item => item.geojson)
                    .forEach(item => {
                        this.getGeoJSON(item.geojson)
                        .then(geoJSON => {
                            if (!geoJSON.properties) geoJSON.properties = {}
                            geoJSON.properties.id = item.id || item.qid || item.eid
                            geoJSON.properties.label = item.label
                            this.addGeoJSONLayer(geoJSON)
                        })
                    })
                }

            }
        },
        addGeoJSONLayer(geoJSON, layerDef) {
            if (!geoJSON.properties) geoJSON.properties = {}
            geoJSON.properties.name = 'name'
            let geoJSONLayer = this.geoJSONLayer(geoJSON, layerDef)
            if (this.timeDimension) {
                geoJSONLayer = L.timeDimension.layer.geoJson(geoJSONLayer, {
                    timeDimension: this.map.timeDimension,
                    duration: this.duration,
                    // waitForReady: true,
                    updateTimeDimension: true,
                    updateTimeDimensionMode: 'replace',
                })
            }
            geoJSONLayer.addTo(this.map)
            this.geoJSONLayers.push(geoJSONLayer)
        },
        geoJSONLayer(geoJSON, layerDef) {
            layerDef = layerDef || {}
            return L.geoJSON(geoJSON, {
                onEachFeature: (feature, layer) => {
                    this.addEventHandlers(layer)
                },
                pointToLayer: (feature, latLng) => {
                    const props = feature.properties
                    if (props['marker-type'] === 'circle' || this.mapDef['marker-type'] === 'circle') {
                        return L.circleMarker(latLng, { radius: this.mapDef['radius'] || props.radius || 4 })
                    } else {
                        return this.makeMarker(latLng, props)
                    }
                },
                // Style
                style: (feature) => {
                    const props = feature.properties
                    const geometry = feature.geometry.type
                    for (let [prop, value] of Object.entries(props)) {
                        if (value === 'null') props[prop] = null
                    }
                    const style = {
                        color: this.mapDef['stroke'] || layerDef['stroke'] || props['stroke'] || '#FB683F',
                        weight: parseFloat(this.mapDef['stroke-width'] || layerDef['stroke-width'] || props['stroke-width'] || (geometry === 'Polygon' || geometry === 'MultiPolygon' ? 0 : 4)),
                        opacity: parseFloat(this.mapDef['stroke-opacity'] || layerDef['stroke-opacity'] || props['stroke-opacity'] || 1),                  
                        fillColor: this.mapDef['fill'] || layerDef['fill'] || props['fill'] || '#32C125',
                        fillOpacity: parseFloat(this.mapDef['fill-opacity'] || layerDef['fill-opacity'] || props['fill-opacity'] || 0.5),
                    }
                    return style
                }
            })
        },
        makeMarker(latlng, props) {
            const faIcon = iconMap[props['marker-symbol']] || props['marker-symbol'] || 'circle'
            return L.marker(latlng, {
                icon: L.icon.fontAwesome({
                    iconClasses: `fa fa-${faIcon}`, // you _could_ add other icon classes, not tested.
                    markerColor: props['marker-color'] || props['fill'] || '#2C84CB',
                    markerFillOpacity: props['opacity'] || 1,
                    markerStrokeColor: props['stroke'] || props['marker-color']|| props['fill'] || '#2C84CB',
                    markerStrokeWidth: props['stroke-width'] || 0,
                    iconColor: props['marker-symbol-color'] || '#FFF',
                    iconXOffset: props['marker-symbol-xoffset'] || 0,
                    iconYOffset: props['marker-symbol-yoffset'] || 0,
                }),
                id: props.eid
            })
        },
        cachedGeoJSON(url) {
            if (!window.geojsonCache) {
                window.geojsonCache = {}
            }
            if (!window.geojsonCache[url]) {
                window.geojsonCache[url] = fetch(url).then(resp => resp.json())
            }
            return window.geojsonCache[url]
        },
        async getGeoJSON(url) {
            const inputType = url.split('.').pop()
            let geoJSON
            if (inputType === 'tsv' || inputType === 'csv') {
                geoJSON = await this.delimitedDataToGeoJSON(url)
            } else {
                geoJSON = await this.cachedGeoJSON(url)
            }
            return geoJSON
        },
        async delimitedDataToGeoJSON(url) {
            const delimiter = url.split('.').pop() === 'tsv' ? '\t' : ','
            let resp = await fetch(url)
            let delimitedDataString = await resp.text()
            const objArray = this.toObjArray(delimitedDataString, delimiter)
            const qids = new Set()
            objArray.forEach(item => qids.add(`wd:${item.qid}`))
            let coordsMap = await this.entityCoordsFromWikidata(Array.from(qids))
            return this.objArraytoGeoJSON(objArray, coordsMap)
        },
        async entityCoordsFromWikidata(qids) {
            const sparql = `
                SELECT ?item ?coords WHERE {
                    VALUES ?item { ${qids.join(' ')} }
                    ?item wdt:P625 ?coords .
                }`
            let resp = await fetch('https://query.wikidata.org/sparql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-agent': 'JSTOR Labs client',
                    Accept: 'application/sparql-results+json'
                },
                body: `query=${encodeURIComponent(sparql)}`
            })
            let wdResp = await resp.json()
            const coordsMap = {}
            wdResp.results.bindings.forEach(rec => {
                const qid = rec.item.value.split('/').pop()
                const latLng = rec.coords.value.replace(/Point\(/,'').replace(/\)/, '').split(' ')
                coordsMap[qid] = [ parseFloat(latLng[0]), parseFloat(latLng[1]) ]
            })
            return coordsMap
        },
        toObjArray(delimitedData, delimiter) {
            delimiter = delimiter || `\t`
            const objArray = []
            const lines = delimitedData.split('\n').filter(line => line.trim() !== '')
            if (lines.length > 1) {
                const keys = lines[0].split(delimiter).map(key => key.trim())
                lines.slice(1).forEach(line => {
                    let obj = {}
                    line.split(delimiter)
                        .map(value => value.trim())
                        .forEach((value, i) => obj[keys[i]] = value)      
                    objArray.push(obj)
                })
            }
            return objArray
        },
        objArraytoGeoJSON(objArray, coordsMap) {
            const geoJSON = { type: 'FeatureCollection', features: [] }
            objArray.forEach(item => {
                const qid = item.qid
                const label = item.label
                const coordinates = coordsMap[qid]
                const time = moment(item.date ? item.date : moment().format('YYYY-MM-DD'))
                if (coordinates) {
                    geoJSON.features.push({
                        type: 'Feature',
                        properties: { label, qid, time },
                        geometry: { type: 'Point', coordinates }
                    })
                }
            })
            return geoJSON
        },
        itemsWithCoordsToGeoJSON(items) {
            const geoJSON = { type: 'FeatureCollection', features: [] }
            items.filter(item => item.coords)
            .forEach(item => {
                geoJSON.features.push({
                    type: 'Feature',
                    properties: item,
                    geometry: { type: 'Point', coordinates: [item.coords[0][1], item.coords[0][0]] }
                })
            })
            return geoJSON
        },
        asDateString(s) {
            // TODO: improve date parsing
            let year = s.match(/\d{4}/)
            return `${year ? year[0] : (new Date()).getFullYear()}-01-01 00:00:00`
        },
        addPopup(id, label, latLng, offset) {
            if (!this.popups[id]) {
                const popup = L.popup({ ...defaults.popupOptions, ...{ offset: L.point(0, offset || 0)}})
                popup.setLatLng(latLng)
                popup.setContent(`<h1 data-eid="${id}">${label}</h1>`)
                popup.options.id = id
                this.popups[id] = popup
            }
            if (this.showLabels) {
                this.map.openPopup(this.popups[id])
            }
        },
        addEventHandlers(layer) {
            layer.on('click', this.setSelectedItemID )
            layer.on('mouseover', this.setHoverItemID )
            layer.on('mouseout', this.setHoverItemID )
        },
        layersUpdated: _.debounce(function () {
            const activeFeatures = new Set(this.features.map(feature => feature.properties.id))
            Object.keys(this.popups).forEach(id => {
                if (!activeFeatures.has(id)) this.map.closePopup(this.popups[id])
            })
            if (this.autoFit) {
                const coords = this.features.map(feature => feature.geometry.coordinates)
                this.map.fitBounds(coords.map(lc => [lc[1], lc[0]]), {padding: [50, 50]})
            }
            this.features = []
        }, 100),
        setHoverItemID(e) {
            this.$emit('hover-id', e.type === 'mouseover'
                ? e.target.feature.properties.id || e.target.feature.properties.qid || e.target.feature.properties.eid
                : null)
        },
        setSelectedItemID(e) {
            this.$emit('selected-id', e.target.feature.properties.id || e.target.feature.properties.qid || e.target.feature.properties.eid)
        },
        // eslint-disable-next-line no-unused-vars
        handleEssayAction({elem, event, action, value}) {
            console.log(`handleEssayAction" event=${event} action=${action} value=${value}`)
            switch(event) {
                case 'click':
                    switch(action) {
                        case 'flyto':
                            // eslint-disable-next-line no-case-declarations
                            const [lat, lng, zoom] = value.split(',').map(arg => parseFloat(arg))
                            this.map.flyTo([lat, lng], zoom)
                            break
                    }                        
                    break
                case 'mouseover':
                    switch(action) { 
                        case 'flyto': 
                            // eslint-disable-next-line no-case-declarations
                            const [lat, lng, zoom] = value.split(',').map(arg => parseFloat(arg))
                            this.map.flyTo([lat, lng], zoom)
                            break
                    }
                    break
            }
        }
    },
    beforeDestroy() {
        this.actionSources.forEach(elem => elem.classList.remove('map-interaction'))
    },
    watch: {
        mapDef: {
            handler: function (mapDef) {
                console.log('mapDef', mapDef)
                if (this.timeDimension) {
                    this.addTimeDimension()
                } else {
                    this.removeTimeDimension()
                }
                this.syncLayers()
            },
            immediate: false
        },
        activeElement: {
            handler: function () {
                // console.log(`${this.$options.name} activeElement=${current}`)
            },
            immediate: true
        },
        isSelected: {
            handler: function (isSelected) {
                if (isSelected) {
                    this.actionSources.forEach(elem => elem.classList.add('map-interaction'))
                } else {
                    this.actionSources.forEach(elem => elem.classList.remove('map-interaction'))
                }
            },
            immediate: true
        },
        selectedItemID: {
            handler: function () {
                // console.log(`map.watch.selectedItemID=${itemID}`)
            },
            immediate: true
        },
        actions: {
            handler: function () {
                this.actions.forEach(action => this.handleEssayAction(action))
            },
            immediate: true
        },
        actionSources: {
            handler: function (current, prior) {
                current.forEach(elem => elem.classList.add('map-interaction'))
                if (prior) prior.forEach(elem => elem.classList.remove('map-interaction'))
            },
            immediate: true
        },
        hoverItemID: {
            handler: function (itemID, prior) {
                if (this.showLabels) {
                    if (prior) {
                        let popup = document.querySelector(`h1[data-eid="${prior}"]`)
                        popup = popup.parentElement.parentElement.parentElement                        
                        popup.childNodes[0].classList.remove('popup-invert')
                        popup.childNodes[1].childNodes[0].classList.remove('popup-invert')
                    }
                    if (itemID) {
                        let popup = document.querySelector(`h1[data-eid="${itemID}"]`)
                        popup = popup.parentElement.parentElement.parentElement
                        popup.childNodes[0].classList.add('popup-invert')
                        popup.childNodes[1].childNodes[0].classList.add('popup-invert')
                    }
                } else {
                    if (prior) this.map.closePopup(this.popups[prior])
                    if (itemID) this.map.openPopup(this.popups[itemID])
                }
            },
            immediate: true
        },
    }
}
</script>

<style>
    .timecontrol-date {
        font-size: 1.0rem;
        font-weight: bold;
    }

    .leaflet-popup-content {
        margin: 5px 8px !important;
        line-height: 1 !important;
    }

    .leaflet-popup-content-wrapper {
        border-radius: 4px !important;
    }

    .leaflet-popup-content-wrapper, .leaflet-popup-tip {
        color: black !important;
        box-shadow: 0 2px 4px rgb(0,0,0,0.5) !important;
    }

    .leaflet-popup-content-wrapper h1 {
        max-width: 120px;
        line-height: 1.2;
        margin: 0;
        font-size: 12px;
        font-weight: 500;
        text-align: center;
        display: inherit;
    }
    .popup-invert {
        background-color: #444 !important;
    }
    .popup-invert h1 {
        color: white !important;
    }

    .leaflet-fa-markers {
        position: absolute;
        left: 0;
        top: 0;
        display: block;
        text-align: center;
        margin-left: -15px;
        margin-top: -50px;
        width: 160px;
        height: 50px;
    }

    .leaflet-fa-markers .marker-icon-svg {
        position: absolute;
    }

    .leaflet-fa-markers .feature-icon {
        position: absolute;
        font-size: 14px;
        line-height: 0px;
        left: 9px;
        top: 10px;
        display: inline-block;
    }

    .map-interaction {
        border-bottom: 2px solid #A9AC00;
        cursor: pointer;
        z-index: 10;
    }
    .map-interaction:hover {
        background: #EBECBB !important;
    }
</style>
