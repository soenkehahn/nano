// @flow

type TrackedEventListener = {|
  eventType: string,
  fun: () => void,
  options: {},
|};

export const setupEventListenerTracker = (): {
  getEventListeners: () => Array<TrackedEventListener>,
} => {
  let eventListeners: Array<TrackedEventListener>;

  beforeEach(() => {
    eventListeners = [];
    (document: any).oldAddEventListener = document.addEventListener;
    (document: any).addEventListener = (eventType, fun, options) => {
      const eventListener: TrackedEventListener = { eventType, fun, options };
      eventListeners.push(eventListener);
      return (document: any).oldAddEventListener(eventType, fun, options);
    };
  });

  afterEach(() => {
    (document: any).addEventListener = (document: any).oldAddEventListener;
    delete (document: any).oldAddEventListener;
    for (const eventListener of eventListeners) {
      document.removeEventListener(eventListener.eventType, eventListener.fun);
    }
  });

  return { getEventListeners: () => eventListeners };
};

export function simulateWheelEvent(options: {|
  clientX: number,
  clientY: number,
  deltaMode: number,
  deltaY: number,
|}) {
  document.dispatchEvent(new WheelEvent("wheel", (options: any)));
}
