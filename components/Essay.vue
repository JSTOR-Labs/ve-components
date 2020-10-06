<template>
  <div ref="essay" id="essay" class="essay-default" v-html="html"/>
</template>

<script>

module.exports = {
  name: 'essay',
  props: {
    html: String,
    layout: String,
    height: Number,
    width: Number,
    viewerIsOpen: Boolean
  },
  data: () => ({
    paragraphs: {},
    scenes: [],
    activeElement: undefined,
    spacer: undefined
  }),
  computed: {
    debug() { return this.$store.getters.debug },
    viewportHeight() { return this.$store.getters.height },
    viewportWidth() { return this.$store.getters.width },
    allItems() { return this.$store.getters.items },
    contentStartPos() { return this.$store.getters.contentStartPos },
    // activeElement() { return store.getters.activeElement },
    activeElements() { return this.$store.getters.activeElements },
    // layout() { return this.$store.getters.layout },
    isMobile() { return this.$store.getters.isMobile },
    hoverItemID() { return this.$store.getters.hoverItemID },
    // viewerIsOpen() { return this.$store.getters.viewerIsOpen },
    triggerHook() { return (this.contentStartPos + this.$store.getters.triggerOffset) / this.$store.getters.height }
  },
  mounted() {
    console.log(`${this.$options.name}.mounted`)
    this.$store.dispatch('setProgress', 0)
    this.groupItems(this.allItems, this.$store.getters.componentSelectors)
    this.$nextTick(() => this.init())
    if (window.location.hash) {
      this.scrollTo(window.location.hash.slice(1))
    }
  },
  methods: {
    init() {
      this.linkTaggedItems()
      // this.addFootnotesHover()
      this.addSpacer()
      // Setup ScrollMagic (https://scrollmagic.io/)
      let first
      let prior
      Array.from(document.body.querySelectorAll('p')).filter(elem => elem.id).forEach((para) => {
        if (!first) first = para.id
        
        const items = this.itemsInElements(this.elemIdPath(para.id), this.allItems)
        this.paragraphs[para.id] = { prior, items }

        if (items.length > 0) {
          para.classList.add('has-items')
          para.addEventListener('click', this.paragraphClickHandler)
        }

        const scene = this.$scrollmagic.scene({
          triggerElement: `#${para.id}`,
          triggerHook: this.triggerHook,
        })
        .on('enter', () => this.setActiveElements(para.id) )
        .on('leave', () => this.setActiveElements(this.paragraphs[para.id].prior) )
        
        if (this.debug) 
        scene.addIndicators({indent: this.layout === 'vertical' ? this.viewportWidth/2 : 0})
        
        this.$scrollmagic.addScene(scene)
        this.scenes.push(scene)        
        prior = para.id

      })
      this.findContent()
      this.setActiveElements(first)
    },
    addSpacer() {
      // Adds a spacer element that expands and contracts to match the size of the visualizer so
      // that content at the end of the article is still reachable by scrolling
      this.spacer = document.createElement('div')
      this.spacer.id = 'essay-spacer'
      this.spacer.style.height = `${this.viewportHeight*.8}px`
      document.getElementById('essay').appendChild(this.spacer)
    },
    setActiveElements(elemId) {
      if (elemId) {
        const newActiveElements = this.elemIdPath(elemId)
        if (newActiveElements.length > 0 && !this.eqSet(new Set(this.activeElements), new Set(newActiveElements))) {
          this.$store.dispatch('setActiveElements', newActiveElements)
          const contentParaIDs = Object.keys(this.paragraphs).filter(pid => pid.indexOf('section-') === 0)
          const idx = contentParaIDs.indexOf(newActiveElements[0])
          this.$store.dispatch('setProgress', Math.round(((idx+1)/contentParaIDs.length)*100))
        }
      }
    },
    getParagraphs(elem, headerSize) {
      headerSize = headerSize || 0
      const paragraphs = []
      if (elem) {
        Array.prototype.slice.call(elem.getElementsByTagName('p')).forEach((para) => {
          if (para.id) {
            const paraTop = para.offsetTop - headerSize
            this.paragraphs[para.id].top = paraTop
            this.paragraphs[para.id].height = para.offsetHeight
            para.title = `${para.id} (${paraTop})`
            paragraphs.push({
              type: 'paragraph',
              id: para.id,
              top: paraTop,
              bottom: para.offsetTop + para.offsetHeight,
              items: this.itemsPartOf(para.id),
            })
          }
        })
      }
      return paragraphs
    },
    findContent() {
      const header = document.getElementById('header')
      const headerSize = header ? header.clientHeight : 0
      // const content = this.getParagraphs(document.getElementById('essay', headerSize))
      const content = []
      for (let i = 1; i < 9; i++) {
        document.body.querySelectorAll(`#essay h${i}`).forEach((heading) => {
          const sectionElem = heading.parentElement
          const sectionId = sectionElem.attributes.id.value
          //sectionElem.title = `${sectionId} (${sectionElem.offsetTop})`
          const section = {
            id: sectionId,
            level: i,
            title: heading.innerHTML,
            top: sectionElem.offsetTop,
            bottom: sectionElem.offsetTop + sectionElem.offsetHeight,
            items: this.itemsPartOf(sectionId),
            paragraphs: this.getParagraphs(sectionElem, headerSize)
          }
          content.push(section)
        })
      }
      this.$store.dispatch('setContent', content)
    },
    itemsPartOf(elemId) {
      const items = []
      this.$store.getters.items.forEach((item) => {
        if (item.found_in.has(elemId) || item.tagged_in.has(elemId) ||
            (item.tag !== 'entity' && item.tagged_in.has('essay'))) {
          items.push(item)
        }
      })
      return items
    },
    scrollTo(elemid) {
      const elem = document.getElementById(elemid)
      if (elem) {
        window.scrollTo(0, elem.offsetTop)
      }
    },
    /*
    addFootnotesHover() {
      document.querySelectorAll('.footnote-ref').forEach((fn) => {
        fn.addEventListener('mouseover', (e) => {
          const fnId = e.toElement.hash.slice(1)
          const fnHTML = document.getElementById(fnId).innerHTML
          // console.log(`footnote: id=${fnId} html="${fnHTML}"`)
        })
      })
    },
    */
    linkTaggedItems() {
      document.querySelectorAll('.tagged').forEach((item) => {
        item.addEventListener('click', this.itemClickHandler)
      })
    },
    paragraphClickHandler(e) {
      this.$emit('collapse-header')
      const paraId = e.target.tagName === 'P'
        ? e.target.id
        : e.target.parentElement.id
      this.$store.dispatch('setSelectedParagraphID', paraId)

      if (this.paragraphs[paraId]) {
        let scrollTo
        const para = this.paragraphs[paraId]
        if (this.layout === 'horizontal') {
          // position active paragraph just above viewer pane, if possible
          const paraBottom = para.top + para.height
          let triggerOffset = this.height/2 + 40
          if (this.height/2 > paraBottom) triggerOffset -= this.height/2 - paraBottom
          this.$store.dispatch('setTriggerOffset', triggerOffset)
          scrollTo = para.top + para.height - this.height/2
        } else {
          scrollTo = para.top - 56
        }
        console.log(`paragraphClickHandler para=${paraId} top=${this.paragraphs[paraId].top} scrollTo=${scrollTo}`)
        let scrollable = document.getElementById('scrollableContent')
        if (!scrollable) scrollable = window
        scrollable.scrollTo(0, scrollTo)
      }

    },
    setHoverItemID(e) {
      this.$store.dispatch('setHoverItemID', e.type === 'mouseover' ? e.target.dataset.eid : null)
    },
    itemClickHandler(e) {
      e.stopPropagation()
      const elemId = e.target.attributes['data-eid'].value
      this.$store.dispatch('setSelectedItemID', elemId)
    },
    addItemClickHandlers(elemId) {
      // console.log(`addItemClickHandlers: elemId=${elemId}`, document.getElementById(elemId))
      document.getElementById(elemId).querySelectorAll('.inferred, .tagged').forEach((entity) => {
        entity.addEventListener('click', this.itemClickHandler)
        entity.addEventListener('mouseover', this.setHoverItemID)
        entity.addEventListener('mouseout', this.setHoverItemID)
      })
    },
    removeItemClickHandlers(elemId) {
      // console.log(`removeItemClickHandlers: elemId=${elemId}`)
      const elem = document.getElementById(elemId)
      if (elem) {
        document.getElementById(elemId).querySelectorAll('.active-elem .inferred, .active-elem .tagged').forEach((entity) => {
          entity.removeEventListener('click', this.itemClickHandler)
          entity.removeEventListener('mouseover', this.setHoverItemID)
          entity.removeEventListener('mouseout', this.setHoverItemID)
        })
      }
    }
  },
  watch: {
    layout: {
      handler () {
        document.getElementById('scrollableContent').scrollTo(0, 0)
        this.findContent()
      },
      immediate: true
    },
    viewerIsOpen: {
      handler (isOpen) {
        if (!isOpen) this.$store.dispatch('setTriggerOffset', 300)
      },
      immediate: true
    },
    activeElements: {
      handler (active) {
        this.activeElement = active[0]
      },
      immediate: true
    },
    activeElement: {
      handler (active, prior) {
        // console.log('Essay.activeElement', active)
        if (prior) this.removeItemClickHandlers(prior)
        if (active) this.addItemClickHandlers(active)
      },
      immediate: true
    },
    hoverItemID: {
      handler: function (itemID, prior) {
        // console.log(`Essay.hoverItemID: value=${itemID} prior=${prior}`)
        if (itemID) document.querySelectorAll(`.active-elem [data-eid="${itemID}"]`).forEach(elem => elem.classList.add('entity-highlight'))
        if (prior) document.querySelectorAll(`.active-elem [data-eid="${prior}"]`).forEach(elem => elem.classList.remove('entity-highlight'))
      },
      immediate: true
    },
    triggerHook: {
      handler: function () {
        this.scenes.forEach(scene => {
          scene.triggerHook(this.triggerHook)
        })
      },
      immediate: true
    }
  }
}
</script>

<style>

.essay-default {
  background-color: #eaeaea;
}

.vertical .essay-default {
  padding: 0 0 0 0 !important;
  margin-right: 4px;
  box-shadow: 5px 5px 10px 0px rgba(0,0,0,0.3);
}

.essay-default p.active-elem {
  background-color: #ffffff;
  border-left: none;
  box-shadow:  4px 4px 4px 0 rgba(0,0,0,0.25);
  position: relative;
  cursor: default;
}

.essay-default p.has-items:hover {
  cursor: pointer !important;
  background-color: #f7f7f7;;
}
  
.essay-default p {
  margin-left: 9px;
  padding-left: 19px;
  padding-right: 28px;
  line-height: 1.6;
}

.vertical p {
  margin-right: 9px;
}

.horizontal p {
  margin-right: 9px;
}

.essay-default h1,
.essay-default h2,
.essay-default h3, 
.essay-default h4, 
.essay-default h5,
.essay-default h6 {
  margin-left: 24px;
}

/*

#visual-essay #essay p.active-elem {
  background-color: #ffffff;
  border-left: none;
  box-shadow:  4px 4px 4px 0 rgba(0,0,0,0.25);
  position: relative;
  cursor: default;
}

#visual-essay #essay p.has-items:hover {
  cursor: pointer !important;
  background-color: #f7f7f7;;
}
*/

/*
#visual-essay.vertical #essay {
    background-color: #eaeaea;
    padding: 0 9px 0 0 !important;
    box-shadow: 5px 5px 10px 0px rgba(0,0,0,0.16);
    font-family: Roboto, sans-serif;
    font-size: 1.3rem;
  }

  #visual-essay.vertical #essay section {
  }

  #visual-essay.vertical #essay section p {
    margin-left: 9px;
    padding-left: 19px;
    padding-right: 28px;
    line-height: 1.6;
  }

 #visual-essay.vertical #essay h1,
 #visual-essay.vertical #essay h2,
 #visual-essay.vertical #essay h3, 
 #visual-essay.vertical #essay h4, 
 #visual-essay.vertical #essay h5 {
    margin-left: 24px;
  }

  #visual-essay.vertical #essay p.active-elem {
    background-color: #ffffff;
    border-left: none;
    box-shadow:  4px 4px 4px 0 rgba(0,0,0,0.25);
    position: relative;
    cursor: default;
  }
  
  #visual-essay.vertical #essay p.has-items:hover {
    cursor: pointer !important;
    background-color: #f7f7f7;;
  }
*/

  .tagged.location,
  p.active-elem .inferred.location,
  .tagged.building,
  p.active-elem .inferred.building,
  .tagged.place,
  p.active-elem .inferred.place,
  .tagged.person,
  p.active-elem .inferred.person,
  .tagged.fictional_character,
  p.active-elem .inferred.fictional_character,
  .tagged.written_work,
  p.active-elem .inferred.written_work,
  .tagged.plant,
  p.active-elem .inferred.plant,
  .tagged.entity,
  p.active-elem .inferred.entity,
  .tagged.event,
  p.active-elem .inferred.event {
    border-bottom: 2px solid #A9AC00;
    cursor: pointer;
    z-index: 10;
  }

  .entity-highlight,
  .tagged.location:hover,
  p.active-elem .inferred.location:hover,
  .tagged.building:hover,
  p.active-elem .inferred.building:hover,
  .tagged.place:hover,
  p.active-elem .inferred.place:hover,
  .tagged.person:hover,
  p.active-elem .inferred.person:hover,
  .tagged.fictional_character:hover,
  p.active-elem .inferred.fictional_character:hover,
  .tagged.written_work:hover,
  p.active-elem .inferred.written_work:hover,
  .tagged.plant:hover,
  p.active-elem .inferred.plant:hover,
  .tagged.entity:hover,
  p.active-elem .inferred.entity:hover,
  .tagged.event:hover,
  p.active-elem .inferred.event:hover {
    background: #EBECBB !important;
  }

</style>