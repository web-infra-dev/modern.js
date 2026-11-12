import { runtime } from '@modern-js/plugin/runtime';
import { expect, it, rs } from '@rstest/core';
import { mfSSRUpdatePlugin } from './updatePlugin';
import { SSR_READY_EVENT } from './devUpdateEvent';

it('revalidates each mounted router after Node readiness and unregisters disposed applications', async () => {
  rs.stubGlobal('window', new EventTarget());
  const instances = ['document', 'fragment'].map(
    output =>
      runtime.run({
        plugins: [mfSSRUpdatePlugin({ name: output })],
        config: {},
      }).runtimeContext,
  );
  const routers = instances.map(() => ({ revalidate: rs.fn() }));
  try {
    await Promise.all(instances.map(instance => instance.ready));
    for (const [index, instance] of instances.entries())
      (instance.runtimeContext as any).application = { router: routers[index] };
    window.dispatchEvent(new Event(SSR_READY_EVENT));
    expect(routers[0].revalidate).toHaveBeenCalledTimes(1);
    expect(routers[1].revalidate).toHaveBeenCalledTimes(1);
    instances[1].dispose();
    window.dispatchEvent(new Event(SSR_READY_EVENT));
    expect(routers[0].revalidate).toHaveBeenCalledTimes(2);
    expect(routers[1].revalidate).toHaveBeenCalledTimes(1);
  } finally {
    instances.forEach(instance => instance.dispose());
    rs.unstubAllGlobals();
  }
});
