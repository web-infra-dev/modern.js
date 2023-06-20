import { ref, defineComponent } from 'vue';

export default defineComponent({
  name: 'Test',

  setup() {
    const count = ref(0);
    return () => (
      <button id="button1" onClick={() => count.value++}>
        A: {count.value}
      </button>
    );
  },
});
