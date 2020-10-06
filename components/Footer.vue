<template>
  <div id="footer">
    <img src="https://jstor-labs.github.io/visual-essays/images/labs.jpg">
  </div>
</template>

<script>

  module.exports = {  
    name: 'Footer',
    props: {},
    data: () => ({}),
    computed: {},
    mounted() {},
    methods: {},
    watch: {}
  }

</script>

<style>
  
  [v-cloak] { display: none; }

  #footer {
    display: flex;
    align-items: center;
    height: 50px;
  } 
  #footer img {
    height: 30px;
    margin: 0 12px;
  }

</style>