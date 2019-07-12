// @flow

import { Minion } from "./minion";
import { fromInt } from "./rational";
import { setupSceneWrapper, setupTestConfig } from "./test/utils";

describe("idle minions", () => {
  const config = setupTestConfig();

  const [wrapper, scene] = setupSceneWrapper(config);

  let minionA, minionB;

  beforeEach(() => {
    scene().objects.minions.add(
      new Minion(config(), scene(), { x: 100, y: 0 }),
    );
    [minionA, minionB] = scene().objects.minions.minions;
  });

  it("pauses the game when one minion is idle", () => {
    minionA.status = { tag: "idle" };
    minionB.status = { tag: "moving", target: { x: 100, y: 100 } };
    wrapper().setProps({ timeDelta: 1 });
    expect(minionB.position).toEqual({ x: 100, y: 0 });
  });

  it("doesn't pause the game when no minion is idle", () => {
    minionA.status = { tag: "moving", target: { x: 0, y: 100 } };
    minionB.status = { tag: "moving", target: { x: 100, y: 100 } };
    wrapper().setProps({ timeDelta: 1 });
    expect([minionA.position, minionB.position]).toEqual([
      { x: 0, y: 1 },
      { x: 100, y: 1 },
    ]);
  });

  it("waiting for target input counts as idle", () => {
    minionA.status = { tag: "waitForMoveTarget" };
    minionB.status = { tag: "moving", target: { x: 100, y: 100 } };
    wrapper().setProps({ timeDelta: 1 });
    expect(minionB.position).toEqual({ x: 100, y: 0 });
  });

  it("pauses lab when a minion is idle", () => {
    scene().focusedMinion().status = { tag: "idle" };
    scene().objects.lab.status = {
      tag: "researching",
      goal: "mining",
      completion: fromInt(0),
    };
    wrapper().setProps({ timeDelta: 1 });
    expect(scene().objects.lab.status.tag).toEqual("researching");
    expect((scene().objects.lab.status: any).completion.toNumber()).toEqual(0);
  });
});
