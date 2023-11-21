export class SequenceWait {
  sequenceList: Map<string, Promise<any>> = new Map();

  sequenceResolveList: Map<string, (value: unknown) => void> = new Map();

  add(key: string) {
    const newPromise = new Promise(resolve => {
      this.sequenceResolveList.set(key, resolve);
    });
    this.sequenceList.set(key, newPromise);
  }

  async waitUntil(waitIndex: string) {
    await Promise.all([this.sequenceList.get(waitIndex)]);
    // wait for some time
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async done(waitIndex: string) {
    const targetResolve = this.sequenceResolveList.get(waitIndex);
    if (targetResolve) {
      targetResolve(null);
    }
  }
}
