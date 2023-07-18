<template>
  <div>
    <button id="button" @click="count++">
      count: {{ count }} foo: {{ foo }}
    </button>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';

export default {
  props: {
    foo: String,
  },
  setup() {
    const count = ref<number>(0);

    return { count };
  },
};
</script>
