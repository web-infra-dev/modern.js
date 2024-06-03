import { model } from '@modern-js/runtime-v2/model';

const countModel = model('count').define({
  state: {
    value: 1,
  },
  actions: {
    add(state) {
      state.value += 1;
    },
  },
});

export default countModel;
