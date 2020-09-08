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
                        console.log(qid, latLng)
                        coords[qid] = [ parseFloat(latLng[1]), parseFloat(latLng[0]) ]
                    })
                    this.data.forEach(rec => {
                        if (coords[rec.QID.id]) {
                            const latLng = coords[rec.QID.id]
                            L.circleMarker(latLng, {
                                radius: 4,
                                fillOpacity: 1
                            })
                            .bindPopup(rec.Location.id)
                            .addTo(map)
                        }
                    })
                })
            })

        }
    }
}

</script>
<style scoped></style>
