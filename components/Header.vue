<template>
  <div ref="header" id="header" class="header" :style="`height:${height}; background-image: url(${banner})`">
    <nav role="navigation">
      <div id="menuToggle">
        <input type="checkbox" />
        <span></span>
        <span></span>
        <span></span>
        <ul id="menu">
          <li @click="menuItemClicked('home')">Home</li>
          <li @click="menuItemClicked('about')">About</li>
          <li @click="menuItemClicked('help')">Help</li>
          <li @click="toggleOption('layout')">Toggle layout</li>
          <li @click="toggleOption('viewerIsOpen')">Toggle viewer</li>
          <li @click="collapseHeader">Collapse header</li>
          <li @click="toggleOption('header')">Toggle header</li>
          <li @click="toggleOption('footer')">Toggle footer</li>
          <li @click="openInfoboxModal">Open infobox</li>
        </ul>
      </div>
    </nav>
    <div class="toolbar-title">{{title || 'Title'}}</div>
  </div>
</template>

<script>
  module.exports = {
    props: {
      essayConfig: { type: Object, default: function(){ return {}} },
      siteConfig: { type: Object, default: function(){ return {}} },
      progress: { type: Number, default: 0 },
      height: Number,
      banner: String,
      nav: { type: Array, default: function(){ return []} },
      appVersion: { type: String },
      libVersion: { type: String }
    },    
    data: () => ({
    }),
    computed: {
      essayConfigLoaded() { return this.essayConfig !== null },
      // banner() { return this.essayConfigLoaded ? (this.essayConfig.banner || this.siteConfig.banner) : null },
      // bannerHeight() { return this.essayConfig && this.essayConfig.bannerHeight || this.siteConfig.bannerHeight || 400 },
      title() { return this.essayConfigLoaded ? (this.essayConfig.title || this.siteConfig.title) : null },
      author() { return (this.essayConfigLoaded && this.essayConfig.author) || '&nbsp;' },
      numMaps() { return (this.essayConfigLoaded && this.essayConfig['num-maps']) },
      numImages() { return (this.essayConfigLoaded && this.essayConfig['num-images']) },
      numSpecimens() { return (this.essayConfigLoaded && this.essayConfig['num-specimens']) },
      numPrimarySources() { return (this.essayConfigLoaded && this.essayConfig['num-primary-sources']) },
      hasStats() { return this.numMaps || this.numImages || this.numSpecimens || this.numPrimarySources }
    },
    mounted() {
      console.log(`Header.mounted: height=${this.height} banner=${this.banner}`)
      this.$refs.header.style.height = `${this.height}px`
    },
    methods: {
      closeDrawer() {
        document.querySelector('#menuToggle input').checked = false
      },
      toggleOption(option) {
        this.closeDrawer()
        this.$emit('toggle-option', option)
      },
      collapseHeader() {
        this.closeDrawer()
        this.$emit('collapse-header')
      },
      menuItemClicked(item) {
        this.closeDrawer()
        console.log(`menuItemClicked=${item}`)
        this.$emit('menu-item-clicked', item)
      },
      viewMarkdown() {
        this.closeDrawer()
        this.$emit('view-markdown')
      },
      editMarkdown(editor) {
        this.closeDrawer()
        this.$emit('edit-markdown', editor)
      },
      openInfoboxModal(editor) {
        this.closeDrawer()
        this.$emit('open-infobox-modal')
      },
      login(editor) {
        this.closeDrawer()
        this.$emit('login')
      }
    },
    watch: {
      height() { 
        // console.log(`header.height=${this.height}`)
        this.$refs.header.style.height = `${this.height}px`
      }
    }
  }
</script>

<style scoped>

  [v-cloak] { display: none; }

  .header {
    grid-area: header;
    min-height: 104px;
    background-repeat: no-repeat;
    background-position: center center;
    background-size: cover;
    position: relative;
  }
    
  #menuToggle a {
    text-decoration: none;
    color: #232323;
    transition: color 0.3s ease;
  }

  #menuToggle a:hover {
    color: tomato;
  }

  #menuToggle input {
    display: block;
    width: 40px;
    height: 32px;
    position: absolute;
    top: -7px;
    left: -5px;
    cursor: pointer;
    opacity: 0; /* hide this */
    z-index: 2; /* and place it over the hamburger */
    -webkit-touch-callout: none;
  }

  /*
  * Just a quick hamburger
  */
  #menuToggle span {
    display: block;
    width: 20px;
    height: 4px;
    margin-bottom: 4px;
    position: relative;
    background: #cdcdcd;
    border-radius: 3px;
    z-index: 1;
    transform-origin: 4px 0px;
    transition: transform 0.5s cubic-bezier(0.77,0.2,0.05,1.0),
                background 0.5s cubic-bezier(0.77,0.2,0.05,1.0),
                opacity 0.55s ease;
  }

  #menuToggle span:first-child {
    transform-origin: 0% 0%;
  }

  #menuToggle span:nth-last-child(2) {
    transform-origin: 0% 100%;
  }

  /* 
  * Transform all the slices of hamburger
  * into a crossmark.
  */
  #menuToggle input:checked ~ span {
    opacity: 1;
    transform: rotate(45deg) translate(-2px, -1px);
    background: #232323;
  }

  /*
  * But let's hide the middle one.
  */
  #menuToggle input:checked ~ span:nth-last-child(3) {
    opacity: 0;
    transform: rotate(0deg) scale(0.2, 0.2);
  }

  /*
  * Ohyeah and the last one should go the other direction
  */
  #menuToggle input:checked ~ span:nth-last-child(2) {
    transform: rotate(-45deg) translate(0, -1px);
  }

  /*
  * Make this absolute positioned
  * at the top left of the screen
  */
  #menu {
    position: absolute;
    width: 300px;
    margin: -100px 0 0 -50px;
    padding: 50px;
    padding-top: 125px;
    background: #ededed;
    list-style-type: none;
    -webkit-font-smoothing: antialiased;
    /* to stop flickering of text in safari */
    transform-origin: 0% 0%;
    transform: translate(-100%, 0);
    transition: transform 0.5s cubic-bezier(0.77,0.2,0.05,1.0);
  }

  #menu li {
    padding: 10px 0;
    font-size: 22px;
  }

  /*
  * And let's slide it in from the left
  */
  #menuToggle input:checked ~ ul {
    transform: none;
  }

  #menuToggle {
    display: block;
    position: relative;
    top: 30px;
    left: 30px;
    z-index: 1;
    -webkit-user-select: none;
    user-select: none;
  }

  .toolbar-title {
    width: 100%;
    color: white;
    background-color: rgba(0, 0, 0, .6);
    padding: 23px 0 0 70px;
    position: absolute;
    top: calc(100% - 127px);
    min-height: 104px;
    font-size: 2rem;
    font-weight: bold;    
  }

</style>