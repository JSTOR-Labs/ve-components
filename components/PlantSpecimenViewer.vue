<template>
  <v-container :style="outerContainerStyle">
    <v-card flat>
      <v-tabs v-model="tab" background-color="primary" dark>
        <v-tab v-for="specimens in specimensByTaxon" :key="specimens.id">
          {{ specimens.taxonName }}
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="tab">
        <v-tab-item
          v-for="(specimens, seq) in specimensByTaxon"
          :key="specimens.id"
        >
          <v-card flat>
            <v-card-text flat :style="innerContainerStyle">
              <image-viewer
                :seq="seq + 1"
                :items="specimens.specimens"
                :width="width"
                :height="height - 46"
                default-fit="cover"
              >
              </image-viewer>
            </v-card-text>
          </v-card>
        </v-tab-item>
      </v-tabs-items>
    </v-card>
  </v-container>
</template>

<script>

const dependencies = []

module.exports = {
    name: "PlantSpecimenViewer",
    props: { items: Array, width: Number, height: Number },
    components: {
        imageViewer: 'url:/components/OpenSeadragonViewer.vue'
    },
    data: () => ({
        tab: undefined,
        specimensByTaxon: [],
    }),
    computed: {
        outerContainerStyle() {
            return {
                width: `${this.width}px`,
                height: `${this.height}px`,
                padding: 0,
            }
        },
        innerContainerStyle() {
            return {
                height: `${this.height - 48}px`,
                padding: 0,
                overflowY: "auto !important",
            }
        },
    },
    mounted() {
        this.loadDependencies(dependencies, 0, this.init)
    },
    methods: {
        init() {
            console.log(`${this.$options.name}.mounted: height=${this.height} width=${this.width}`)
        },
        getSpecimenMetadata(item) {
            const id = item.jpid || item.eid
            if (item.specimensMetadata) {
                this.specimensByTaxon = [...this.specimensByTaxon, item.specimensMetadata]
            } else {
                const args = Object.keys(item)
                .filter((arg) => ["max", "reverse"].includes(arg))
                .map((arg) => `${arg}=${item[arg]}`)
                const url = `/specimens/${id}` + (args ? `?${args.join("&")}` : "")
                console.log(url)
                fetch(url).then((resp) => resp.json())
                .then((specimensMetadata) => {
                    if (specimensMetadata.specimens.length > 0) {
                        specimensMetadata.caption = item.label || item.title
                        specimensMetadata.specimens.forEach((specimen) => {
                            specimen.url = specimen.images.find((img) => img.type === 'best').url
                            specimen.title = specimen.description
                        })
                        this.specimensByTaxon = [...this.specimensByTaxon, specimensMetadata]
                        console.log('specimensByTaxon', this.specimensByTaxon)
                    }
                })
            }
        }
    },
    watch: {
        items: {
            handler: function(current, prior) {
                const currentItemIds = new Set(current.map((item) => item.id))
                const priorItemIds = new Set((prior || []).map((item) => item.id))
                if (!this.eqSet(currentItemIds, priorItemIds)) {
                    this.specimensByTaxon = []
                    this.items.forEach((item) => this.getSpecimenMetadata(item))
                }
            },
            immediate: true
        }
    }
};
</script>
