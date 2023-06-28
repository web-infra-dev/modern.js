<template>
  <div>
    <button id="button" @click="count++">{{ count }}</button>
    <Foo />
  </div>
</template>

<script setup lang="tsx">
import { VNode, ref } from 'vue';

const Foo = (): VNode => {
  return <div id="foo">Foo</div>;
};

const count = ref<number>(0);
</script>
