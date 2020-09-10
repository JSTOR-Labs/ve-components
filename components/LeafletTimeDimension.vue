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
    'https://cdn.jsdelivr.net/npm/moment@2.27.0/moment.min.js'
]

// Some leaflet baselayers
const baseLayers = {
    'OpenStreetMap': ['https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            { maxZoom: 18, attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' }],
    'Esri_WorldPhysical': ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}', 
            { maxZoom: 8, attribution: 'Tiles &copy; Esri &mdash; Source: US National Park Service' }],
    'OpenTopoMap': ['https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            { maxZoom: 17, attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)' }],
    'Stamen_Watercolor': ['https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}',
            {	subdomains: 'abcd', minZoom: 1, maxZoom: 16, ext: 'jpg', attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }],
    'Stadia_AlidadeSmooth': ['https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
        { attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',  maxZoom: 20 }],
    'Stadia_AlidadeSmoothDark': ['https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
        { attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors', maxZoom: 20 }],
    'Esri_WorldGrayCanvas': ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ', maxZoom: 16 }]
}

const defaults = {
    // Leaflet Map options
        baseLayer: 'OpenStreetMap',
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
}

module.exports = {
    name: "LeafletTimeDimension",
    props: {
        items: Array,
        width: Number,
        height: Number,
    },
    data: () => ({
        map: undefined,
        layerCoords: []
    }),
    computed: {
        item() { return this.items.length > 0 ? this.items[0] : {} },
        mapDef() { return this.item },
        data() { return this.mapDef.data },
        baseLayer() { return this.mapDef.basemap || defaults.baseLayer },
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
                overflowY: "auto !important",
                marginLeft: "24px",
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
                this.map = L.map('map', {
                    center: this.center,
                    zoom: this.zoom,
                    zoomSnap: 0.1,
                    maxZoom: this.maxZoom,
                    fullscreenControl: true,
                    preferCanvas: true,
                    layers: [L.tileLayer(...baseLayers[this.baseLayer])]
                })

                if (this.timeDimension) {
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

                    let timeDimensionControl = new L.Control.TimeDimension(timeDimensionControlOptions)
                    // override L.Control.TimeDimension_getDisplayDateFormat for custom date formatting
                    timeDimensionControl._getDisplayDateFormat = (date) => {
                        return moment(date).format(this.dateFormat)
                    }
                    this.map.addControl(timeDimensionControl)

                    this.map.on('layeradd', e => {
                        if (e.layer.feature) {
                            this.layerCoords.push(e.layer.feature.geometry.coordinates)
                            this.layersUpdated()
                        }
                    })
                }
            }
        },
        syncLayers() {
            const geoJSONLayerDefs = []
            if (this.mapDef.data) {
                geoJSONLayerDefs.push({url: this.mapDef.data})
            }
            this.syncGeoJSONLayers(geoJSONLayerDefs)
        },
        syncGeoJSONLayers(layerDefs) {
            layerDefs.forEach(def => {
                this.getGeoJSON(def.url)
                .then(geoJSON => {
                    // console.log(JSON.stringify(geoJSON, null, 2))
                    let geoJSONLayer = this.geoJSONLayer(geoJSON)
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
                })
            })
        },
        geoJSONLayer(geoJSON) {
            return L.geoJSON(geoJSON, {
                pointToLayer: function (feature, latLng) {
                    const marker = L.circleMarker(latLng, {
                        radius: 4,
                        fillOpacity: 1                        
                    })
                    if (feature.properties.label) {
                        marker.bindPopup(feature.properties.label)
                    }
                    return marker
                }
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
        asDateString(s) {
            // TODO: improve date parsing
            let year = s.match(/\d{4}/)
            return `${year ? year[0] : (new Date()).getFullYear()}-01-01 00:00:00`
        },
        layersUpdated: _.debounce(function () {
            if (this.autoFit) {
                this.map.fitBounds(this.layerCoords.map(lc => [lc[1], lc[0]]), {padding: [50, 50]})
            }
            this.layerCoords = []
        }, 100)
    },
    watch: {
        mapDef: {
            handler: function () {
                this.syncLayers()
            },
            immediate: false
        }
    }
}
</script>

<style>
    .timecontrol-date {
        font-size: 1.0rem;
        font-weight: bold;
    }
</style>
