<template>
  <div>
    <button id="button" @click="count++">{{ count }}</button>
    <Foo />
  </div>
</template>

<script setup lang="jsx">
import { ref } from 'vue';

const Foo = () => {
  return <div id="foo">Foo</div>;
};

const count = ref(0);
</script>
