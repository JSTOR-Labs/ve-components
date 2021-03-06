<template>
  <div class="entity-infobox">
    <div class="entity-image-holder" v-if="imageSrc" :style="{backgroundSize: imageFit, backgroundImage: 'url(' + imageSrc + ')'}"></div>
    <h3 class="entity-title" primary-title v-html="title"></h3>
    <div class="subtitle">{{ description }}</div>
    <div class="entity-description" v-html="html"></div>
    <a :href="entity.wikipedia_page" target="_blank">Source</a>
  </div>
</template>

<script>

module.exports = {
  name: 'entity-infobox',
  props: {
    eid: { type: String, default: undefined },
    imageFit: { type: String, default: 'cover' }
    /* imageFit:
       fill = stretched to fit box
       contain = maintain its aspect ratio, scaled fit within the element’s box, letterboxed if needed
       cover = fills entire box, maintains aspect ration, clipped to fit
       none = content not resized
       scale-down = same as none or contain, whichever is smaller
    */
  },
  data: () => ({
    requested: new Set(),
    entityInfo: undefined
  }),
  computed: {
    entity () { return this.$store.getters.items.find(entity => this.eid === entity.eid || this.eid === entity.id) || {} },
    // entityInfo () { return this.entity['summary info'] },
    title () { return this.entityInfo && this.entityInfo.displaytitle || this.entity.label || this.entity.title },
    description () { return this.entityInfo ? this.entityInfo.description : this.entity.description },
    thumbnail () { return this.entityInfo && this.entityInfo.thumbnail ? this.entityInfo.thumbnail.source : null },
    imageSrc () { return this.thumbnail ?  this.thumbnail : this.entity.images ? this.entity.images[0] : null },
    html () { return this.entityInfo ?  this.entityInfo.extract_html : null },
    context() { return this.$store.getters.context },
    apiBaseURL() { return window.location.origin }
  },
  mounted() {
    this.getSummaryInfo()
  },
  methods: {
    toQueryString(args) {
      const parts = []
      Object.keys(args).forEach((key) => {
        parts.push(`${key}=${encodeURIComponent(args[key])}`)
      })
      return parts.join('&')
    },
    getEntity() {
      let url = `${this.apiBaseURL}/entity/${encodeURIComponent(this.eid)}`
      const args = {}
      if (this.context) args.context = this.context
      if (this.entity.article) args.article = this.entity.article
      if (Object.keys(args).length > 0) {
        url += `?${this.toQueryString(args)}`
      }
      console.log(`getEntity=${url}`)
      return fetch(url).then(resp => resp.json())
    },
    getSummaryInfo() {
      console.log('getSummaryInfo', this.eid, this.entity)
      if (this.entity['summary info']) {
        this.entityInfo = this.entity['summary info']
      } else if (!this.requested.has(this.entity.id)) {
        this.requested.add(this.entity.id)
        this.getEntity()
          .then((updated) => {
            if (!updated['summary info']) {
              updated['summary info'] = null
            }
            this.entityInfo = updated['summary info']
            updated.id = this.eid
            this.$store.dispatch('updateItem', updated)
          })
      }
    }
  },
  watch: {
    entity() {
      this.getSummaryInfo()
    }
  }
}
</script>

<style scoped>

  .source-link {
    position: absolute;
    float: left;
    padding-left: 8px;
  }

  .entity-infobox {
    align-items: left;
  }

  .entity-infobox .v-card__text {
    height: 100%;
    min-height: 165px;
    padding-bottom: 0 !important;
  }

  .entity-title {
    padding: 0 6px;;
    margin-bottom: 8px;
  }

  .entity-image-holder {
    width: 100%;
    height: 300px;
    background-color: #7F828B;
    background-size: cover;
    background-position: center;
    margin-bottom: 16px;
  }

  .subtitle {
    line-height: 1em;
    margin-bottom: 16px;
    font-size: 16px;
    padding: 0 6px;;
  }

  .entity-description {
    padding: 0 6px 12px 6px;
  }

</style>
