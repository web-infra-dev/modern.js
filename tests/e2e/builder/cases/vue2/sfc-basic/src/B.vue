<template>
  <button id="button2" @click="count++">B: {{ count }}</button>
</template>

<script>
import { ref } from 'vue';

export default {
  setup() {
    const count = ref(0);
    return { count };
  },
};
</script>
