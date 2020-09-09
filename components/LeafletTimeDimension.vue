<template>
  <div id="map" :style="containerStyle"></div>
</template>

<script>
/* global L, _ */

const dependencies = [
    'https://cdn.jsdelivr.net/npm/leaflet@1.5.1/dist/leaflet.css',
    'https://cdn.jsdelivr.net/npm/leaflet-timedimension@1.1.1/dist/leaflet.timedimension.control.min.css',
    'https://cdn.jsdelivr.net/npm/leaflet@1.5.1/dist/leaflet.js',
    'https://cdn.jsdelivr.net/npm/iso8601-js-period@0.2.1/iso8601.min.js',
    'https://cdn.jsdelivr.net/npm/leaflet-timedimension@1.1.1/dist/leaflet.timedimension.min.js'
]

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
module.exports = {
    name: "LeafletTimeDimension",
    props: {
        items: Array,
        width: Number,
        height: Number,
    },
    data: () => ({
        timeDimension: true,
        autoPlay: true,
        loop: false,
        baseLayer: 'Esri_WorldGrayCanvas',
        autoFit: true,
        fps: 1,
        layerCoords: []
    }),
    computed: {
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
        console.log(this.$options.name, this.items)
        this.loadDependencies(dependencies, 0, this.init)
  },
  methods: {
        init() {
            let map = L.map('map', {
                center: [25, 0],
                zoom: 2.5,
                zoomSnap: 0.1,
                maxZoom: 5,
                fullscreenControl: true,
                layers: [L.tileLayer(...baseLayers[this.baseLayer])]
            })

            if (this.timeDimension) {
                let timeDimension = new L.TimeDimension({
                    timeInterval: '1888-01-01/P1Y',
                    period: 'P1Y'
                })
                map.timeDimension = timeDimension

                let player = new L.TimeDimension.Player({
                    transitionTime: 1000/this.fps,
                    loop: this.loop,
                    startOver: true
                }, timeDimension)

                let timeDimensionControlOptions = {
                    timeSliderDragUpdate: true,
                    loopButton: true,
                    autoPlay: this.autoPlay,
                    player:        player,
                    timeDimension: timeDimension,
                    position:      'bottomleft',
                    minSpeed:      1,
                    speedStep:     0.5,
                    maxSpeed:      15
                }

                var timeDimensionControl = new L.Control.TimeDimension(timeDimensionControlOptions)
                map.addControl(timeDimensionControl)

                map.on('layeradd', e => {
                    if (e.layer.feature) {
                        this.layerCoords.push(e.layer.feature.geometry.coordinates)
                        this.layersUpdated(map)
                    }
                })
            }

            // Get data TSV file and convert to array of JSON object
            fetch(this.items[0].url).then(resp => resp.text())
            .then(delimitedDataString => {
                this.data = this.delimitedStringToObjArray(delimitedDataString)
                // Get distinct QIDs from input data
                const qids = new Set()
                this.data.forEach(item => qids.add(`wd:${item.QID.id}`))
                return Array.from(qids)
            })
            .then(qids => {
                // Get geo coordinates for Wikidata QIDs
                const sparql = `
                SELECT ?item ?coords WHERE {
                    VALUES ?item { ${qids.join(' ')} }
                    ?item wdt:P625 ?coords .
                }`
                fetch('https://query.wikidata.org/sparql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-agent': 'JSTOR Labs client',
                        Accept: 'application/sparql-results+json'
                    },
                    body: `query=${encodeURIComponent(sparql)}`
                }).then(resp => resp.json())
                .then(resp => {
                    // maps QID to latLng coords
                    const coordsMap = {}
                    resp.results.bindings.forEach(rec => {
                        const qid = rec.item.value.split('/').pop()
                        const latLng = rec.coords.value.replace(/Point\(/,'').replace(/\)/, '').split(' ')
                        coordsMap[qid] = [ parseFloat(latLng[0]), parseFloat(latLng[1]) ]
                    })
                    // create geoJSON map layer after converting data to GeoJSON object
                    const geoJSONLayer = L.geoJSON(this.toGeoJSON(this.data, coordsMap), {
                        pointToLayer: function (feature, latLng) {
                            return L.circleMarker(latLng, {
                                radius: 4,
                                fillOpacity: 1
                            })
                        }
                    })
                    if (this.timeDimension) {
                       let geoJSONTDLayer = L.timeDimension.layer.geoJson(geoJSONLayer, {
                            updateTimeDimension: true,
                            duration: 'P1Y',
                            updateTimeDimensionMode: 'replace',
                            addlastPoint: true
                        })
                        geoJSONTDLayer.addTo(map)
                    } else {
                        geoJSONLayer.addTo(map)
                    }
                })
            })

        },
        toGeoJSON(data, coordsMap) {
            const times = {}
            data.forEach(rec => {
                const dateStr = this.asDateString(rec.Date.id)
                if (!times[rec.QID.id]) times[rec.QID.id] = []
                times[rec.QID.id].push(dateStr)
            })
            const added = new Set()
            const geoJSON = { type: 'FeatureCollection', features: [] }
            this.data.forEach(rec => {
                const qid = rec.QID.id
                const label = rec.Location.id
                const coordinates = coordsMap[qid]
                if (coordinates && !added.has(qid)) {
                    added.add(qid)
                    geoJSON.features.push({
                        type: 'Feature',
                        properties: { label, qid, times: times[qid] },
                        geometry: { type: 'Point', coordinates }
                    })
                }
            })
            return geoJSON
        },
        asDateString(s) {
            let year = s.match(/\d{4}/)
            return `${year ? year[0] : (new Date()).getFullYear()}-01-01 00:00:00`
        },
        layersUpdated: _.debounce(function (map) {
            if (this.autoFit) {
                map.fitBounds(this.layerCoords.map(lc => [lc[1], lc[0]]), {padding: [50, 50]})
            }
            this.layerCoords = []
        }, 100)
    }
}
</script>

<style scoped></style>
