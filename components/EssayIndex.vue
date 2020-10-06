<template>
  <div id="essay" v-html="html"/>
</template>

<script>

module.exports = {
  name: 'EssayIndex',
  props: {
    html: String
  },
  data: () => ({}),
  computed: {},
  mounted() {
    console.log(`${this.$options.name}.mounted`)
  },
  methods: {},
  watch: {}
}

</script>

<style>
</style>
