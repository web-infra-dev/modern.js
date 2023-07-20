<template>
  <div>
    <button id="button" @click="count++">{{ count }}</button>
    <Foo />
  </div>
</template>

<script lang="jsx">
import { ref } from 'vue';

const Foo = {
  render() {
    return <div id="foo">Foo</div>;
  },
};

export default {
  components: {
    Foo
  },

  setup() {
    const count = ref(0);
    return { count };
  },
};
</script>
