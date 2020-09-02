<template>
  <div id="image-viewer" >
    <component 
      v-bind:is="mode === 'iiif' ? 'openSeadragonImageViewer' : 'staticImageViewer'"
      :acct="acct"
      :repo="repo"
      :path="path"
      :width="width" 
      :height="height" 
      :seq="seq" 
      :items="items" 
      :selected="selected"
      :active="activeElement" 
      :default-fit="defaultFit"
    ></component>
  </div>
</template>

<script>

module.exports = {
  name: 'ImageViewer',
  props: {
    acct: String,
    repo: String,
    path: String,
    seq: {type: Number, default: 1},
    items: Array,
    activeElement: String,
    width: Number,
    height: Number,
    initialMode: { type: String, default: 'iiif' },
    defaultFit: {type: String, default: 'cover'},
    selected: String,
    another: String
  },
  components: {
    openSeadragonImageViewer: 'url:/components/ImageViewer/OpenSeadragonViewer.vue',
    staticImageViewer: 'url:/components/ImageViewer/StaticImageViewer.vue'
  },
  data: () => ({
    mode: 'static',
  }),
  mounted() {
    console.log(`ImageViewer.mounted: seq=${this.seq} initialMode=${this.initialMode} activeElement=${this.activeElement}`)
  },
  watch: {
    activeElement: {
      handler: function () {
        console.log(`ImageViewer.activeElement=${this.activeElement}`)
      },
      immediate: true
    },
    items: {
      handler: function () {
        const itemWithModeDefined = this.items.find(item => item.iiif || item.static)
        const requestedMode = itemWithModeDefined
          ? itemWithModeDefined.static
            ? 'static'
            : 'iiif'
          : undefined
        this.mode = requestedMode || this.initialMode
        console.log(`ImageViewer items=${this.items.length} requestedMode=${requestedMode} mode=${this.mode}`, this.items)
      },
      immediate: true
    }
  }
}
</script>