<template>
  <div class="main">
    <div v-if="label" id="top-overlay" class="overlay">
      <template v-if="annotations.length > 0">
        <img :src="`${prefixUrl}next_rest.png`" style="float:right;" @click="viewNextAnnotation">
        <img :src="`${prefixUrl}previous_rest.png`" style="float:right;" @click="viewPreviousAnnotation">
        <img :src="`${prefixUrl}home_rest.png`" style="float:right;" @click="goHome()">
      </template>
      <div v-html="label" style="float:left;"></div>
    </div>
    <div id="osd" :style="osdContainerStyle"></div>
    <div id="bottom-overlay" class="overlay" @click="copyTextToClipboard"></div>
  </div>
</template>

<script>
/* global OpenSeadragon, _, sjcl */

const annosEndpoint = 'https://annotations.visual-essays.app/ve/'
const dependencies = [
  'https://cdn.jsdelivr.net/npm/openseadragon@2.4/build/openseadragon/openseadragon.min.js',
  'https://recogito.github.io/js/openseadragon-annotorious.min.js',
  'https://cdn.jsdelivr.net/npm/sjcl@1.0.8/sjcl.min.js'
  // 'https://altert.github.io/OpenseadragonFabricjsOverlay/openseadragon-fabricjs-overlay.js',
  // 'https://altert.github.io/OpenseadragonFabricjsOverlay/fabric/fabric.adapted.js'
]

const prefixUrl = 'https://raw.githubusercontent.com/jstor-labs/ve-components/master/public/images/'
const annosHeaders = {
  'Content-Type': 'application/ld+json; profile="http://www.w3.org/ns/anno.jsonld"', 
  Accept: 'application/ld+json; profile="http://www.w3.org/ns/anno.jsonld"'
}

module.exports = {
  name: 'OpenSeadragonViewer',
  props: {
    actions: { type: Array, default: () => ([]) },
    actionSources: { type: Array, default: () => ([]) },
    acct: String,
    repo: String,
    path: String,
    active: String,
    items: Array,
    width: Number,
    height: Number,
    defaultFit: {type: String, default: 'cover'},
    selected: String
  },
  data: () => ({
    prefixUrl,
    manifests: undefined,
    page: 0,
    currentItem: undefined,
    viewer: undefined,
    imageSize: undefined,
    annotator: undefined,
    annotatorEnabled: false,
    annoCursor: 0,
    overlay: undefined
  }),
  computed: {
    osdContainerStyle() {
      return {
        backgroundColor: 'black',
        textAlign: 'center',
        height: `${this.height}px`,
        width: `${this.width}px`,
        maxHeight: this.annotatorEnabled ? `${this.width}px` : ''
      }
    },
    fit() { return this.currentItem.fit || this.defaultFit },
    target() { 
      //return this.currentItem && this.currentItem.sequences[0].canvases[0].otherContent
      //  ? this.currentItem.sequences[0].canvases[0].otherContent[0]['@id'].split('?target=')[1]
      //  : null
      const imageSourceHash = this.sha256(this.currentItem.sequences[0].canvases[0].images[0].resource['@id'])
      return `https://visual-essays.app/${this.acct}/${this.repo}${this.path}/${imageSourceHash}`
    },
    annotations() { const annos = this.currentItem ? this.currentItem.annotations || [] : []; console.log('annotations', annos.length); return annos; },
    metadata() {
      const metadata = {} 
      if (this.currentItem && this.currentItem.metadata) {
        this.currentItem.metadata.forEach(md => metadata[md.label] = md.value)
      }
      console.log('metadata', metadata)
      return metadata
    },
    label() { return this.annoCursor > 0 
      ? this.currentItem.annotations[this.annoCursor - 1].body[0].value
      : this.metadata.label || this.currentItem ? this.currentItem.label : null
    }
  },
  mounted() {
    this.loadDependencies(dependencies, 0, this.init)
  },
  methods: {
    init() {
      console.log(this.$options.name, this.items, this.active, this.width, this.height, this.defaultFit, this.selected)
      console.log(`acct=${this.acct} repo=${this.repo} path=${this.path}`)
      this.initViewer()
      this.loadManifests(this.items)
    },
    sha256(s) {
      return sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(s))
    },
    initViewer() {
      console.log('initViewer')
      if (this.viewer) {
        this.viewer.destroy()
      }
      this.$nextTick(() => {
        this.viewer = OpenSeadragon({
          id: 'osd',
          prefixUrl: this.prefixUrl,
          sequenceMode: true,
          showReferenceStrip: true,
          showNavigationControl: true,
          minZoomImageRatio: 0.2,
          maxZoomPixelRatio: 5,
          // homeFillsViewer: true,
          // degrees: parseInt(this.currentItem.rotate || '0'),
          // animationTime: 100,
          showHomeControl: true,
          showZoomControl: true,
          showFullPageControl: false,
          showNavigator: false
          //preserveImageSizeOnResize: false,
          //autoResize: false
        })
        // this.viewer.viewport.goHome = function(immediately) { if (this.viewer) this.viewer.raiseEvent('home', { immediately: immediately }) }
        this.addAnnotatorToggleButton()
        this.viewer.addHandler('home', (e) => {
          this.annoCursor = 0
          this.positionImage(e.immediately, 'home')
        })
        this.viewer.addHandler('page', this.newPage)
        this.viewer.addHandler('viewport-change', this.viewportChange)
        this.viewer.world.addHandler('add-item', () => {
          this.imageSize = this.viewer.world.getItemAt(0).getContentSize()
          console.log(`width=${this.imageSize.x} height=${this.imageSize.y}`)
          // this.positionImage(false, 'add-item')
        })
        // if (this.viewer.referenceStrip.element) this.viewer.referenceStrip.element.style.height= '100px'
        if (this.manifests) {
          this.viewer.open(this.manifests.map(manifest => `${manifest.sequences[0].canvases[0].images[0].resource.service['@id']}/info.json`))
        }
        // console.log(this.drawRect({left: 0, top: 0, width: this.viewer.drawer.canvas.width-2, height: this.viewer.drawer.canvas.height-2, stroke: 'red', strokeWidth: 2, fill: null}))
      })
    },
    /*
    drawRect(rect) {
      console.log('drawRect', rect)
      if (!this.overlay) this.overlay = this.viewer.fabricjsOverlay({scale: 1})
      this.overlay.resize()
      return this.overlay.fabricCanvas().add(new fabric.Rect(rect))
    },
    */
    loadManifests(items) {
      console.log('loadManifests')
      const sortedItems = [
        ...items.filter(item => item.primary === 'true'),
        ...items.filter(item => item.primary !== 'true')
      ]
      Promise.all(sortedItems.map(item => fetch(item.manifest).then(resp => resp.json())))
        .then(manifests => {
          this.manifests = manifests.map((manifest, idx) => {return {...manifest, ...items[idx]}})
          const tileSources = this.manifests.map(manifest => {
            return manifest.iiif && manifest.sequences[0].canvases[0].images[0].resource.service
              ? `${manifest.sequences[0].canvases[0].images[0].resource.service['@id']}/info.json`
              : { url: manifest.sequences[0].canvases[0].images[0].resource['@id'] || manifest.metadata.find(md => md.label === 'source').value,
                 type: 'image', buildPyramid: true }
          })
          console.log('tileSources', tileSources)
          this.viewer.open(tileSources)
        })
    },
    positionImage (immediately, from) {
      immediately = immediately || false
      console.log('positionImage', from, immediately)
      if (this.currentItem) {
        this.$nextTick(() => {
          if (this.currentItem.region) {
            this.viewer.viewport.fitBounds(this.parseRegionString(this.currentItem.region), immediately)
          } else {
            const widthScale = this.imageSize.x / this.width
            const heightScale = this.imageSize.y / this.height            
            this.fit === 'cover'
              ? widthScale > heightScale ? this.viewer.viewport.fitVertically(immediately) : this.viewer.viewport.fitHorizontally(immediately)
              : widthScale > heightScale ? this.viewer.viewport.fitHorizontally(immediately) : this.viewer.viewport.fitVertically(immediately)
          }
        })
      }
    },
    goHome(immediately) {
      immediately = immediately || false
      if (this.viewer) this.viewer.viewport.goHome(immediately)
    },
    viewportChange: _.debounce(function () {
      const bottomOverlay = document.getElementById('bottom-overlay')
      if (bottomOverlay) bottomOverlay.innerHTML = this.imageViewportCoords()
    }, 100),
    addAnnotatorToggleButton() {
      let customButton = new OpenSeadragon.Button({
        tooltip: 'Toggle annotator enabled',
        srcRest: `${this.prefixUrl}selection_rest.png`,
        srcGroup: `${this.prefixUrl}selection_grouphover.png`,
        srcHover: `${this.prefixUrl}selection_hover.png`,
        srcDown: `${this.prefixUrl}selection_pressed.png`,
        onClick: this.toggleAnnotatorEnabled
      })
      // this.viewer.addControl(customButton.element, { anchor: OpenSeadragon.ControlAnchor.TOP_LEFT })
      this.viewer.buttons.buttons.push(customButton)
      this.viewer.buttons.element.appendChild(customButton.element)
    },
    toggleAnnotatorEnabled() {
     this.annotatorEnabled = !this.annotatorEnabled
    },
    newPage(e) {
      this.page = e.page
    },
    attr(label) {
      const attr = this.currentItem.metadata
        ? this.currentItem.metadata.find(md => md.label === label)
        : undefined
      return attr ? attr.value : undefined
    },
    initAnnotator() {
      console.log('initAnnotator', this.currentItem.annotations.length)
      if (this.annotator) {
        this.annotator.destroy()
      }
      this.annotator = OpenSeadragon.Annotorious(this.viewer, { readOnly: false })
      this.annotator.off()
      this.annotator.on('selectAnnotation', this.annotationSelected)
      this.annotator.on('createAnnotation', this.createAnnotation)
      this.annotator.on('updateAnnotation', this.updateAnnotation)
      this.annotator.on('deleteAnnotation', this.deleteAnnotation)
      this.currentItem.annotations.map(anno => this.annotator.addAnnotation(anno))
      this.setAnnotatorEnabled(this.annotatorEnabled)
    },
    loadAnnotations() {
      const url = `${annosEndpoint}?target=${encodeURIComponent(this.target)}`
      console.log('loadAnnotations', this.target, url)
      return fetch(url)
        .then(resp => resp.json())
        .then(data => {
          const annotations = data.first.items || data.items || []
          this.currentItem = { ...this.currentItem, ...{ annotations } } 
          return this.currentItem.annotations
        })
    },
    annotationSelected(anno) {
      console.log('annotationSelected', anno)
      document.querySelector('#bottom-overlay').innerHTML = anno.id.split('/').pop()
      // this.annotator.fitBounds(anno)
    },
    createAnnotation(anno) {
      console.log('createAnnotation', anno)
      anno.seq = this.currentItem.annotations ? this.currentItem.annotations.length : 0
      anno.target.id = this.target
      fetch(`${annosEndpoint}`, {method: 'POST', headers: annosHeaders, body: JSON.stringify(anno)})
      .then(resp => resp.json())
      .then(createdAnno => {
        this.currentItem = { ...this.currentItem, ...{annotations: [...this.currentItem.annotations, createdAnno]}}
      })
    },
    updateAnnotation(anno) {
      console.log('updateAnnotation', anno)
      const _id = anno.id.split('/').pop()
      fetch(`${annosEndpoint}${_id}`, {method: 'PUT', headers: annosHeaders, body: JSON.stringify(anno)})
      .then(resp => resp.json())
      .then(updated => {
        const annoId = updated.id.split('/').pop()
        let idx, existing
        for (idx = 0; idx < this.currentItem.annotations.length; idx++) {
          if (this.currentItem.annotations[idx].id === annoId) {
            existing = this.currentItem.annotations[idx]
            break
          }
        }
        const annotations = this.currentItem.annotations.filter(_anno => _anno.id !== annoId)
        annotations.splice(idx, 0, { ...existing, ...{text: updated.body[0].value}})
        this.currentItem = { ...this.currentItem, ...{annotations}}
      })
    },
    deleteAnnotation(anno) {
      const _id = anno.id.split('/').pop()
      fetch(`${annosEndpoint}${_id}`, { method: 'DELETE' })
      .then(resp => {
        if (resp.ok) {
          const annoId = resp.url.split('/').pop()
          const annotations = this.currentItem.annotations.filter(_anno => _anno.id !== annoId)
          this.currentItem = { ...this.currentItem, ...{annotations}}
          this.goHome()
        }
      })
    },
    viewNextAnnotation() {
      this.annoCursor = this.annoCursor < this.currentItem.annotations.length ? this.annoCursor + 1 : 0
      this.gotoAnnotation(this.currentItem.annotations[this.annoCursor - 1])
    },
    viewPreviousAnnotation() {
      this.annoCursor = this.annoCursor > 1 ? this.annoCursor - 1 : 0
      if (this.annoCursor === 0) {
        this.goHome()
      } else {
        this.gotoAnnotation(this.currentItem.annotations[this.annoCursor - 1])
      }
    },
    gotoAnnotation(anno) {
      this.annoCursor = this.currentItem.annotations.indexOf(anno) + 1
      if (this.annoCursor === 0) {
        this.goHome()
      } else {
        this.gotoRegion(anno.target.selector.value.split('=')[1])
      }
    },
    gotoRegion(region) {
      console.log(`gotoRegion=${region}`)
      this.viewer.viewport.zoomSpring.animationTime = 2
      this.viewer.viewport.fitBounds(this.parseRegionString(region))
      this.viewer.viewport.zoomSpring.animationTime = 1.2
    },
    imageViewportCoords() {
      const viewportBounds = this.viewer.viewport.getBounds()
      const tiledImage = this.viewer.world.getItemAt(0)
      if (tiledImage) {
        const imageBounds = tiledImage.viewportToImageRectangle(viewportBounds)
        return `${Math.ceil(imageBounds.x)},${Math.ceil(imageBounds.y)},${Math.ceil(imageBounds.width)},${Math.ceil(imageBounds.height)}`
      }
    },
    addHandlers(elemId) {
      console.log('addHandlers')
      Array.from (document.querySelectorAll(`#${elemId} span`))
        .filter(elem => elem.dataset)
        .forEach(elem => {
          for (let i = 0; i < elem.attributes.length; i++) {
            const attr = elem.attributes.item(i)
            if (attr.name.indexOf('data-') === 0) {
              const event = attr.name.split('-')[1]
              if (event === 'click') elem.addEventListener(event, this.onClick)
            }
          }
        })
    },
    removeHandlers(elemId) {
      console.log('removeHandlers')
      Array.from (document.querySelectorAll(`#${elemId} span`))
        .filter(elem => elem.dataset)
        .forEach(elem => {
          for (let i = 0; i < elem.attributes.length; i++) {
            const attr = elem.attributes.item(i)
            if (attr.name.indexOf('data-') === 0) {
              const event = attr.name.split('-')[1]
              if (event === 'click') elem.removeEventListener(event, this.onClick)
            }
          }
        })
    },
    onClick(e) {
      e.stopPropagation()
      for (let i = 0; i < e.target.attributes.length; i++) {
        const attr = e.target.attributes.item(i)
        if (attr.name.indexOf('data-click-') === 0) {
          const action = attr.name.split('-')[2]
          const value = attr.value
          console.log(`onClick action=${action} value=${value}`)
          if (action === 'annotation') {
            const anno = this.currentItem.annotations.find(anno => anno.id === value)
            if (anno) this.gotoAnnotation(anno)
          }
        }
      }
    },
    copyTextToClipboard(e) {
      if (navigator.clipboard) navigator.clipboard.writeText(e.target.textContent)
    },
    parseRegionString(region) {
      const s1 = region.split(':')
      let ints = s1[s1.length-1].split(',').map(v => parseInt(v))
      if (ints.length === 4) {
        if (s1.length === 1 || (s1.length === 2 && (s1[0] === 'px' || s1[0] === 'pixel'))) {
          return this.viewer.viewport.imageToViewportRectangle(new OpenSeadragon.Rect(...ints))
        } else if (s1.length === 2 && (s1[0] === 'pct' || s1[0] === 'percent')) {
          const size = this.viewer.world.getItemAt(0).getContentSize()
          if (size.x > 0 && size.y > 0) {
            return this.viewer.viewport.imageToViewportRectangle(
              Math.round(size.x * ints[0]/100),
              Math.round(size.y * ints[1]/100),
              Math.round(size.x * ints[2]/100), 
              Math.round(size.y * ints[3]/100)
            )
          }
        }
      }
    },
    setAnnotatorEnabled(enabled) {
      const osdElem = document.getElementById('osd')
      if (osdElem) {
        document.getElementById('osd').style.maxHeight = enabled ? `${this.width}px` : ''
        Array.from (document.querySelectorAll('.a9s-annotationlayer')).forEach(elem => elem.style.display = enabled ? '' : 'none')
      }
    },
    handleEssayAction({elem, event, action, value}) {
      console.log(`handleEssayAction" event=${event} action=${action} value=${value}`)
      switch(event) {
          case 'click':
              switch(action) {
                case 'zoomto':
                  this.gotoRegion(value)
                  break
              }                        
              break
          case 'mouseover':
            break
      }
    }
  },
  beforeDestroy() {
    this.actionSources.forEach(elem => elem.classList.remove('image-interaction'))
  },        
  watch: {
    height: {
      handler: function () {
        this.goHome(true)
      },
      immediate: true
    },
    active: {
      handler: function (current, prior) {
        console.log(`${this.$options.name} active=${this.active}`)
        if (prior) this.removeHandlers(prior)
        this.addHandlers(current)
      },
      immediate: true
    },
    selected: {
      handler: function (current, prior) {
        console.log(`${this.$options.name} selected=${current} prior=${prior}`)
        if (prior === 'imageViewer') {
            this.actionSources.forEach(elem => elem.classList.remove('image-interaction'))
        }
        if (prior && current === 'imageViewer') {
          this.$nextTick(() => {
            this.actionSources.forEach(elem => elem.classList.add('image-interaction'))
            setTimeout(() => this.goHome(true), 1)
          })
        }
      },
      immediate: false
    },
    items: {
      handler: function (current, previous) {
        const currentManifests = current.map(item => item.manifest)
        const previousManifests = previous ? previous.map(item => item.manifest) : []
        console.log('items', current, previous)
        if (currentManifests.join() !== previousManifests.join()) {
          this.loadManifests(this.items)
        } else {
          this.page = 0
          this.currentItem = { ...this.manifests[this.page], ...current[0] }
        }
        // this.positionImage(false, 'items')
      },
      immediate: false
    },
    manifests: {
      handler: function (manifests) {
        console.log('manifests', manifests)
        if (manifests) {
          this.page = 0
          this.currentItem = manifests[this.page]
        }
      },
      immediate: false
    },
    page() {
      this.currentItem = this.manifests[this.page]
    },
    actions: {
      handler: function () {
        this.actions.forEach(action => this.handleEssayAction(action))
      },
      immediate: true
    },
    actionSources: {
      handler: function (current, prior) {
          current.forEach(elem => elem.classList.add('image-interaction'))
          if (prior) prior.forEach(elem => elem.classList.remove('image-interaction'))
      },
      immediate: true
    },
    currentItem: {
      handler: function (current, previous) {
        console.log('currentItem', current, previous)
        if (current && (!previous || current['@id'] !== previous['@id'])) {
          this.loadAnnotations()
          .then(() => this.initAnnotator())
        }
      },
      immediate: true
    },
    annotatorEnabled: {
      handler: function (annotatorIsEnabled) {
        this.setAnnotatorEnabled(annotatorIsEnabled)
      },
      immediate: false
    },
    acct: {
      handler: function (acct) {
        console.log(`osd.acct=${acct}`)
      },
      immediate: true
    }
  }
}
</script>

<style>
.openseadragon-container > div:nth-of-type(2) {
  margin: 8px 24px !important;
}

#top-overlay {
  width: 400px;
  height: 100px;
  padding: 6px;
  margin: 40px 0 0 28px;
  font-size: 1.1em;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}

#bottom-overlay {
  bottom: 0;
  right: 0;
  width: 150px;
  height: 24px;
  color: white;
  font-size: 10pt;
  padding: 2px;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

.main {
  background-color: black;
  margin: auto;
}

.main .overlay {
  background-color: rgba(255, 255, 255, 0.8);
  visibility: hidden;
  opacity: 0;
  transition: all 1s ease-out;
  position: absolute;
  z-index: 2;
}

.main:hover .overlay {
  visibility: visible;
  opacity: 1;
  transition: all 1s ease-in;
}

.a9s-annotationlayer {
  visibility: hidden;
  opacity: 0;
  transition: all 1s ease-out;
}
.main:hover .a9s-annotationlayer {
  visibility: visible;
  opacity: 1;
  transition: all 1s ease-in;
}

/*
.linked-anno {
  border-bottom: 2px solid #A9AC00;
  cursor: pointer;
  z-index: 10;
}

.linked-anno:hover {
  background: #EBECBB !important;
}
*/

.image-interaction {
    border-bottom: 2px solid #A9AC00;
    cursor: pointer;
    z-index: 10;
}
.image-interaction:hover {
    background: #EBECBB !important;
}

</style>