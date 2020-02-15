// @flow

import { Minion } from "./scene/minion";
import { cloneDeep } from "lodash";
import { fromInt } from "./data/rational";
import { sendMinion, setupSceneWrapper, setupTestConfig } from "./test/utils";

const config = setupTestConfig();

const { scene, step } = setupSceneWrapper(config);

describe("pausing", () => {
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
    step(2);
    expect(minionB.position).toEqual({ x: 100, y: 0 });
  });

  it("doesn't pause the game when no minion is idle", () => {
    minionA.status = { tag: "moving", target: { x: 0, y: 100 } };
    minionB.status = { tag: "moving", target: { x: 100, y: 100 } };
    step(2);
    expect([minionA.position, minionB.position]).toEqual([
      { x: 0, y: 1 },
      { x: 100, y: 1 },
    ]);
  });

  it("waiting for target input counts as idle", () => {
    minionA.status = { tag: "waitForMoveTarget" };
    minionB.status = { tag: "moving", target: { x: 100, y: 100 } };
    step(2);
    expect(minionB.position).toEqual({ x: 100, y: 0 });
  });

  it("pauses lab when a minion is idle", () => {
    scene().focusedMinion().status = { tag: "idle" };
    scene().objects.lab.status = {
      tag: "researching",
      goal: "auto-resource-seeking",
      completion: fromInt(0),
    };
    step(2);
    expect(scene().objects.lab.status.tag).toEqual("researching");
    expect((scene().objects.lab.status: any).completion.toNumber()).toEqual(0);
  });
});

describe("speeding up", () => {
  beforeEach(() => {
    config().stepsBeforeSpeedup = 5;
    config().velocity = fromInt(1);
    config().stepTimeDelta = fromInt(1);
  });

  it("speeds up exponentially when the number of steps exceeds Config.stepsBeforeSpeedup", () => {
    sendMinion(scene, { x: 0, y: 1000 });
    let expectedPosition = 0;
    for (let t = 0; t < 25; t++) {
      const numberOfSteps = Math.floor(
        Math.pow(Math.pow(2, 1 / config().stepsBeforeSpeedup), t),
      );
      expectedPosition += numberOfSteps;
      step(1);
      expect({
        time: t,
        position: scene().focusedMinion().position.y,
      }).toEqual({ time: t, position: expectedPosition });
    }
  });

  it("pauses when minions are idle after speeding up", () => {
    const otherMinion = new Minion(config(), scene(), { x: 100, y: 0 });
    scene().objects.minions.add(otherMinion);
    otherMinion.status = { tag: "moving", target: { x: 100, y: 100 } };
    sendMinion(scene, { x: 0, y: 4.5 });
    step(8);
    const before = cloneDeep(otherMinion.position);
    step(1);
    const after = otherMinion.position;
    expect(after).toEqual(before);
  });

  it("starts back at normal velocity after pausing", () => {
    sendMinion(scene, { x: 0, y: 4.5 });
    step(10);
    sendMinion(scene, { x: 0, y: 100 });
    step(1);
    expect(scene().focusedMinion().position.y).toEqual(5.5);
  });
});
