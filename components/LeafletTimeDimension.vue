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
                zoom: 14,
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
                center: [36.72, -4.43]
            })

            let osmLayer = L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            })
            osmLayer.addTo(map)

            let oReq = new XMLHttpRequest()
            oReq.addEventListener('load', (xhr) => {
                var response = xhr.currentTarget.response
                var data = JSON.parse(response)
                this.addGeoJSONLayer(map, data)
            })
            oReq.open('GET', 'data/bus.json')
            oReq.send()
        },
        addGeoJSONLayer(map, data) {
            let icon = L.icon({
                iconUrl: 'data/images/bus.png',
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
