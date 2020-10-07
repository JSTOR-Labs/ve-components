<template>
    <div>
        <div id="menu" ref="menu">
            <ul>
                <li v-for="(item, componentName) in configs" :key="componentName" @click="component=componentName">{{componentName}}</li>
            </ul>
        </div>
        <div id="app" :style="containerStyle">
            <component v-bind:is="component"
                :items="configs[component].items"
                :itemsInActiveElements="configs[component].itemsInActiveElements" 
                :width="width" :height="height" 
                :hoverItemID="hoverItemID"
                :selectedItemID="selectedItemID"
                @hover-id="hoverItemID = $event"
                @selected-id="selectedItemID = $event"
            />
        </div>
    </div>
</template>

<script>
  /* global _ */
  import D3Network from './components/D3Network.vue'
  import D3PlusNetwork from './components/D3PlusNetwork.vue'
  import D3PlusRingNetwork from './components/D3PlusRingNetwork.vue'
  import IIIFSideBySide from './components/IIIFSideBySide.vue'
  import VisNetwork from './components/VisNetwork.vue'
  import StoriiiesViewer from './components/StoriiiesViewer.vue'
  import LeafletMap from './components/LeafletMap.vue'
  import ImageViewer from './components/ImageViewer/index.vue'
  import OpenSeadragonViewer from './components/ImageViewer/OpenSeadragonViewer.vue'
  import MiradorViewer from './components/ImageViewer/MiradorViewer.vue'
  import StaticImageViewer from './components/ImageViewer/StaticImageViewer.vue'
  import VideoPlayer from './components/VideoPlayer.vue'
  import PlantSpecimenViewer from './components/PlantSpecimenViewer.vue'
  import LeafletTimeDimension from './components/LeafletTimeDimension.vue'

  const configs = {
    IIIFSideBySide: {items: [{ 
        id: 'item-0',
        url1: 'https://iiif.visual-essays.app/images/88b53551f91eaeea450ff6c196b4fd5f9fd6955b356d616543af591f/info.json',
        url2: 'https://iiif.visual-essays.app/images/a58d7d72db0b59290c54d57e414d88d892efee1b88cc639ee0f6dc3f/info.json'
    }]},
    D3Network: {items: [{ id: 'item-0', url: 'data/miserables-1.json' }]},
    D3PlusNetwork: {items: [{ id: 'item-0', url: 'data/heliconia.tsv' }]},
    D3PlusRingNetwork: {items: [{ id: 'item-0', url: 'data/medici.tsv' }]},
    // VisNetwork: [{ id: 'item-0', file: 'data/medici.tsv', layout: 'network', arrows: 'to'  }],
    VisNetwork: {items: [{ id: 'item-0', file: 'data/heliconia.tsv', layout: 'network', arrows: 'to'  }]},
    StoriiiesViewer: {items: [{ id: '3f1du' }]},
    VideoPlayer: {items: [{ id: 'EvUK6ANy5II' }]},
    LeafletMap: {items: [{ 
        id: 'map-0',
        // center: [38.88, -77.03],
        center: [0, 50],
        zoom: 2,
        'hide-labels': 'true',
        'time-selector': '0:2020',
        layers: [
            // { id: 'map-layer-1', type: 'mapwarper', 'mapwarper-id': '37798', title: 'Cherry festival map', active: true },
            // { id: 'map-layer-2', type: 'geojson', url: 'https://data.whosonfirst.org/859/317/79/85931779.geojson' , title: 'Washington DC', active: true },
            { id: 'map-layer-3', type: 'geojson', url: 'data/cities.json' , 'date-field': 'inception', title: 'Cities', active: true },
       ]
    }]},
    ImageViewer: {items: [{ 
        id: 'item-0',
        static: 'true',
        url: 'https://iiif.visual-essays.app/images/497cf8340bb1cb2790d0d57417e9868a479afaf65d952fc102987dd1/full/1000,/0/default.png',
        'iiif-url': 'https://iiif.visual-essays.app/images/497cf8340bb1cb2790d0d57417e9868a479afaf65d952fc102987dd1'}]},
    OpenSeadragonViewer: {items: [{ 
        id: 'item-0', 
        'iiif-url': 'https://free.iiifhosting.com/iiif/4f44449c4d7bad07c9175a07f32accba70a702e3a15e5e6ae6bfc30f784a09e1',
        source: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Tidal_Basin_in_Spring.jpg',
        title: 'The Tidal Basin' }]},
    MiradorViewer: {items: [{ id: 'item-0', manifest: 'https://iiif.visual-essays.app/presentation/abb458de59f40c53bed8886f824e90fa30bef566c90a373f3964ae89/manifest' }]},
    StaticImageViewer: {items: [
        { id: 'item-0', url: 'https://upload.wikimedia.org/wikipedia/commons/0/02/Ann_Arbor_Art_Fair%2C_2019.jpg', title: 'Ann Arbor Art Fair' },
        { id: 'item-1', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Michigan_Theater%2C_Ann_Arbor_2020-05-05.jpg/1024px-Michigan_Theater%2C_Ann_Arbor_2020-05-05.jpg' }
    ]},
    PlantSpecimenViewer: {items: [{ id: 'item-0', eid: 'Q165321', max: 1 }] },
    LeafletTimeDimension: {
        items: [
            {
                id: 'item-0',
                data: 'data/cities.json',
                'time-dimension': 'true',
                'time-interval': '-008000/',
                'duration': 'P10000Y',
                basemap: 'Esri_WorldGrayCanvas',
                'max-zoom': '4',
                'date-format': 'YYYY',
                'auto-play': 'false',
                'auto-fit': 'false',
                fps: '4'
            }
        ],
    }    
    /*
    LeafletTimeDimension: {
        items: [
            {
                id: 'item-0',
                // data: 'https://raw.githubusercontent.com/JSTOR-Labs/plant-humanities/develop/graphs/corpse_flower.tsv',
                data: 'https://raw.githubusercontent.com/JSTOR-Labs/plant-humanities/develop/geojson/corpse_flower_bloom.json',
                'time-dimension': 'true',
                'time-interval': '1888/',
                basemap: 'Esri_WorldGrayCanvas',
                'max-zoom': '4',
                'date-format': 'YYYY',
                'auto-play': 'false',
                'auto-fit': 'false',
                fps: '4'
            }
        ],
        itemsInActiveElements: [
            {
                "title": "Kew Gardens",
                "eid": "wd:Q188617",
                "tag": "entity",
                "id": "wd:Q188617",
                "tagged_in": [
                    "essay"
                ],
                "fromCache": true,
                "aliases": [
                    "Kew Royal Botanic Gardens",
                    "Royal Botanic Gardens"
                ],
                "category": "location",
                "coords": [
                    [
                        51.474666666,
                        -0.295466666
                    ]
                ],
                "description": "world's largest collection of living plants in the London Borough of Richmond upon Thames",
                "images": [
                    "http://commons.wikimedia.org/wiki/Special:FilePath/Palmhuis.jpg"
                ],
                "label": "Kew Gardens",
                "qid": "wd:Q188617",
                "wikipedia_page": "https://en.wikipedia.org/wiki/Kew_Gardens",
                "geojson": "https://data.whosonfirst.org/857/885/43/85788543.geojson",
                "found_in": [
                    "section-1-2"
                ]
            },{
                "title": "Sumatra",
                "eid": "wd:Q3492",
                "tag": "entity",
                "id": "wd:Q3492",
                "tagged_in": [
                    "essay"
                ],
                "fromCache": true,
                "aliases": [
                    "Pulau Sumatera",
                    "Sumatra Island",
                    "Sumatra, Indonesia",
                    "Sumatera",
                    "Sumatera Island"
                ],
                "category": "location",
                "coords": [
                    [
                        0.0,
                        102.0
                    ]
                ],
                "description": "island in western Indonesia, westernmost of the Sunda Islands",
                "images": [
                    "http://commons.wikimedia.org/wiki/Special:FilePath/Nepenthes%20junghuhnii%20distribution.png"
                ],
                "label": "Sumatra",
                "qid": "wd:Q3492",
                "wikipedia_page": "https://en.wikipedia.org/wiki/Sumatra",
                "geojson": "https://data.whosonfirst.org/890/496/673/890496673.geojson",
                "found_in": [
                    "section-1-1",
                    "section-1-2"
                ]
            },{
                "title": "New York Botanical Garden",
                "eid": "wd:Q636275",
                "tag": "entity",
                "id": "wd:Q636275",
                "tagged_in": [
                    "essay"
                ],
                "fromCache": true,
                "aliases": [
                    "NYBG",
                    "The New York Botanical Garden"
                ],
                "category": "location",
                "coords": [
                    [
                        40.863611,
                        -73.878333
                    ]
                ],
                "description": "botanical garden in the Bronx, New York City",
                "images": [
                    "http://commons.wikimedia.org/wiki/Special:FilePath/NY%20Botanical%20Garden.jpg"
                ],
                "label": "New York Botanical Garden",
                "qid": "wd:Q636275",
                "wikipedia_page": "https://en.wikipedia.org/wiki/New_York_Botanical_Garden",
                "found_in": [
                    "section-1-2"
                ]
            },{
                "title": "Roseville High School",
                "eid": "wd:Q7368732",
                "tag": "entity",
                "id": "wd:Q7368732",
                "tagged_in": [
                    "essay"
                ],
                "fromCache": true,
                "category": "entity",
                "coords": [
                    [
                        38.75764,
                        -121.27542
                    ]
                ],
                "description": "high school in Roseville, Placer County, California",
                "label": "Roseville High School",
                "qid": "wd:Q7368732",
                "wikipedia_page": "https://en.wikipedia.org/wiki/Roseville_High_School_(Roseville,_California)",
                "found_in": [
                    "section-1-2"
                ]
            }
        ]
    */
  }

  const component = window.location.search.split('component=').pop() || 'LeafletTimeDimension'

  export default {
    name: 'App',
    components: {
      D3Network,
      D3PlusNetwork,
      D3PlusRingNetwork,
      IIIFSideBySide,
      VisNetwork,
      StoriiiesViewer,
      LeafletMap,
      ImageViewer,
      OpenSeadragonViewer,
      MiradorViewer,
      StaticImageViewer,
      VideoPlayer,
      PlantSpecimenViewer,
      LeafletTimeDimension
    },
    data: () => ({
      component,
      configs,
      height: 0,
      width: 0,
      hoverItemID: undefined,
      selectedItemID: undefined,
    }),
    computed: {
        containerStyle() { return { width: `${this.width}px`, height: `${this.height}px` } }
    },
    created() {
    },
    mounted() {
        this.height = Math.ceil(Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) * 0.8) - this.$refs.menu.clientHeight
        this.width = Math.ceil(Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) * 0.8)
        window.addEventListener('resize', this.windowResize)
    },
    methods: {
        windowResize: _.debounce(function (e) {
            this.height = Math.ceil(e.target.innerHeight * 0.8) - this.$refs.menu.clientHeight
            this.width = Math.ceil(e.target.innerWidth * 0.8)
        }, 100)
    },
    watch: {
        height: {
            handler: function () {
                console.log(`window.resize width=${this.width} height=${this.height}`)
            },
            immediate: true
        }
    }
  }
</script>

<style scoped>

    #app {
        border: 1px solid black;
    }

    #menu ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    #menu li {
        cursor: pointer;
    }

</style>
