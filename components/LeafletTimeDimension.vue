<template>
  <div id="map" :style="containerStyle"></div>
</template>

<script>
/* global L */

const dependencies = [
    'https://cdn.jsdelivr.net/npm/leaflet@1.5.1/dist/leaflet.css',
    'https://cdn.jsdelivr.net/npm/leaflet-timedimension@1.1.1/dist/leaflet.timedimension.control.min.css',
    'https://cdn.jsdelivr.net/npm/leaflet@1.5.1/dist/leaflet.js',
    'https://cdn.jsdelivr.net/npm/iso8601-js-period@0.2.1/iso8601.min.js',
    'https://cdn.jsdelivr.net/npm/leaflet-timedimension@1.1.1/dist/leaflet.timedimension.min.js'
]

module.exports = {
    name: "LeafletTimeDimension",
    props: {
        items: Array,
        width: Number,
        height: Number,
    },
    data: () => ({
        map: null
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
                zoom: 2.5,
                zoomSnap: 0.1,
                fullscreenControl: true,
                timeDimensionControl: true,
                timeDimensionControlOptions: {
                    timeSliderDragUpdate: true,
                    loopButton: true,
                    autoPlay: true,
                    playerOptions: {
                        transitionTime: 250,
                        loop: false
                    }
                },
                timeDimension: true,
                center: [25, 0]
            })

            let osmLayer = L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            })
            osmLayer.addTo(map)

            fetch(this.items[0].url).then(resp => resp.text())
            .then(delimitedDataString => {
                this.data = this.delimitedStringToObjArray(delimitedDataString)
                console.log(this.data)
                const qids = new Set()
                this.data.forEach(item => qids.add(`wd:${item.QID.id}`))
                return Array.from(qids)
            })
            .then(qids => {
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
                    const coords = {}
                    resp.results.bindings.forEach(rec => {
                        const qid = rec.item.value.split('/').pop()
                        const latLng = rec.coords.value.replace(/Point\(/,'').replace(/\)/, '').split(' ')
                        coords[qid] = [ parseFloat(latLng[0]), parseFloat(latLng[1]) ]
                    })
                    const geoJSON = this.asGeoJSON(coords)
                    const geoJSONLayer = L.geoJSON(geoJSON, {
                        pointToLayer: function (feature, latLng) {
                            return L.circleMarker(latLng, {
                                radius: 4,
                                fillOpacity: 1
                            })
                        }
                    })
                    let geoJSONTDLayer = L.timeDimension.layer.geoJson(geoJSONLayer, {
                        updateTimeDimension: true,
                        duration: 'P100Y',
                        updateTimeDimensionMode: 'replace',
                        addlastPoint: true
                    })
                    geoJSONTDLayer.addTo(map)
                })
            })

        },
        asGeoJSON(coords) {
            const times = {}
            this.data.forEach(rec => {
                if (!times[rec.QID.id]) times[rec.QID.id] = []
                times[rec.QID.id].push(this.asYear(rec.Date.id))
            })
            const added = new Set()
            const geoJSON = { type: 'FeatureCollection', features: [] }
            this.data.forEach(rec => {
                const qid = rec.QID.id
                const label = rec.Location.id
                const coordinates = coords[qid]
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
        asYear(s) {
            let year = s.match(/\d{4}/)
            year = year ? year[0] : '2020'
            return `${year}-01-01 00:00:00`
        }
    }
}
</script>

<style scoped></style>
