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
                        transitionTime: 1000,
                        loop: true
                    }
                },
                timeDimension: true,
                center: [25, 0]
            })

            let osmLayer = L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            })
            osmLayer.addTo(map)

            /*
            let oReq = new XMLHttpRequest()
            oReq.addEventListener('load', (xhr) => {
                var response = xhr.currentTarget.response
                var data = JSON.parse(response)
                this.addGeoJSONLayer(map, data)
            })
            oReq.open('GET', 'data/bus.json')
            oReq.send()
            */

            fetch(this.items[0].url).then(resp => resp.text())
            .then(delimitedDataString => {
                this.data = this.delimitedStringToObjArray(delimitedDataString)
                const qids = new Set()
                this.data.forEach(item => qids.add(`wd:${item.QID.id}`))
                return Array.from(qids)
            })
            .then(qids => {
                console.log(qids.join(' '))
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
                        const latlng = rec.coords.value.replace(/Point\(/,'').replace(/\)/, '').split(' ')
                        coords[qid] = [ parseFloat(latlng[1]), parseFloat(latlng[0]) ]
                    })
                    console.log(coords)
                    this.data.forEach(rec => {
                        const latLng = coords[rec.QID.id]
                        L.marker(latLng).addTo(map)
                    })
                })
            })

        },
        addGeoJSONLayer(map, data) {
            let icon = L.icon({
                iconUrl: 'images/bus.png',
                iconSize: [22, 22],
                iconAnchor: [11, 11]
            })

            let geoJSONLayer = L.geoJSON(data, {
                pointToLayer: function (feature, latLng) {
                    // eslint-disable-next-line
                    if (feature.properties.hasOwnProperty('last')) {
                        return new L.Marker(latLng, {
                            icon: icon
                        })
                    }
                    return L.circleMarker(latLng)
                }
            })

            let geoJSONTDLayer = L.timeDimension.layer.geoJson(geoJSONLayer, {
                updateTimeDimension: true,
                duration: 'PT2M',
                updateTimeDimensionMode: 'replace',
                addlastPoint: true
            })

            // Show both layers: the geoJSON layer to show the whole track
            // and the timedimension layer to show the movement of the bus 
            geoJSONLayer.addTo(map)
            geoJSONTDLayer.addTo(map)
        }
    }
}
</script>

<style scoped></style>
