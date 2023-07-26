<template>
  <div>
    <button id="button1" @click="count++">A: {{ count }}</button>
    <B />
  </div>
</template>

<script>
import { ref } from 'vue';
import B from './B.vue';

export default {
  components: {
    B,
  },

  setup() {
    const count = ref(0);

    return {
      count,
    };
  },
};
</script>
