<template>
  <div ref="essay" id="essay" :class="layout[0] === 'v' ? 'vertical' : 'horizontal'" v-html="html"/>
</template>

<script>

module.exports = {
  name: 'essayIndex',
  data: () => ({}),
  computed: {
    html() { return this.$store.getters.essayHTML },
    layout() { return this.$store.getters.layout },
    isMobile() { return this.$store.getters.isMobile }
  },
  mounted() {
    console.log(`${this.$options.name}.mounted`)
  }
}

</script>

<style>
</style>