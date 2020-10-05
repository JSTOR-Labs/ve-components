<template>
  <!--
  <v-container id="footer" ref="footer" v-mutate.attr="onMutate" style="z-index:100 !important;">
    <v-row>
      <v-col cols="6" nogutter>
        <img src="https://jstor-labs.github.io/visual-essays/images/labs.jpg" height="30px">
      </v-col>
      <v-col cols="6">
      </v-col>
    </v-row>
  </v-container>
  -->
  <div id="footer" ref="footer" class="footer" :style="style">
    <img src="https://jstor-labs.github.io/visual-essays/images/labs.jpg" height="30px">
  </div>
</template>

<script>
  const defaultHeight = 50

  module.exports = {  
    data: () => ({
      height: undefined
    }),
    computed: {
      style() { return {
        height: `${this.height || defaultHeight}px`
      }}
    },
    mounted() {
      // console.log('Footer', this.$refs.footer)
      this.height = this.$refs.footer.clientHeight
      this.$emit('footer-height', this.height)
    },
    methods: {
      onMutate(mutations) {
        console.log('onMutate', this.$refs.footer)
        const mutation = mutations[mutations.length - 1]
        if (mutation.target && mutation.target.clientHeight !== this.height) {
          this.height = mutation.target.clientHeight
          this.$emit('footer-height', this.height)
        }
      }
    }
  }
</script>

<style>
  
  [v-cloak] { display: none; }

  #footer {
    display: flex;
    align-items: center;
  } 
  .footer img {
    margin: 0 12px;
  }

</style>