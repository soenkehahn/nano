// @flow

import { LabRender } from "./lab";
import { type Vector, toClickEvent } from "./vector";
import { cloneDeep } from "lodash";
import { fromInt, rational } from "./rational";
import {
  sendMinion,
  setupSceneWrapper,
  setupTestConfig,
  unsafeGet,
} from "./test/utils";
import {
  setupEventListenerTracker,
  simulateWheelEvent,
} from "./test/eventListeners";

const config = setupTestConfig();

describe("Lab", () => {
  setupEventListenerTracker();

  beforeEach(() => {
    config().velocity = 1000;
    config().miningVelocity = fromInt(1);
  });

  const { wrapper, scene, step } = setupSceneWrapper(config);

  beforeEach(() => {
    simulateWheelEvent({ clientX: 0, clientY: 0, deltaMode: 1, deltaY: 100 });
    step(1);
  });

  it("renders a lab (out of the initial view)", () => {
    expect(
      wrapper()
        .find(LabRender)
        .exists(),
    ).toEqual(true);
  });

  describe("mining", () => {
    it("allows to research mining", () => {
      wrapper()
        .find("#moveButton")
        .simulate("click");
      wrapper()
        .find("svg")
        .simulate("click", toClickEvent(scene().objects.lab.position));
      step(1);
      expect(
        wrapper()
          .find("#researchMiningButton")
          .exists(),
      ).toEqual(true);
      expect(
        wrapper()
          .find("#newResearch-mining")
          .exists(),
      ).toEqual(false);
      wrapper()
        .find("#researchMiningButton")
        .simulate("click");
      sendMinion(scene, { x: 0, y: 10000 });
      step(10);
      expect(
        wrapper()
          .find("#newResearch-mining")
          .text(),
      ).toEqual("mining");
    });

    it("disallows researching when already researched", () => {
      wrapper()
        .find("#moveButton")
        .simulate("click");
      wrapper()
        .find("svg")
        .simulate("click", toClickEvent(scene().objects.lab.position));
      step(1);
      wrapper()
        .find("#researchMiningButton")
        .simulate("click");
      step(10);
      expect(
        wrapper()
          .find("#researchMiningButton")
          .exists(),
      ).toEqual(false);
    });

    test("researching takes time", () => {
      config().researchVelocity = rational(1, 5);
      wrapper()
        .find("#moveButton")
        .simulate("click");
      wrapper()
        .find("svg")
        .simulate("click", toClickEvent(scene().objects.lab.position));
      step(1);
      expect(
        wrapper()
          .find("#researchMiningButton")
          .exists(),
      ).toEqual(true);
      expect(
        wrapper()
          .find(LabRender)
          .props().completion,
      ).toEqual(null);
      wrapper()
        .find("#researchMiningButton")
        .simulate("click");
      sendMinion(scene, { x: 0, y: 10000 });
      step(3);
      expect(
        wrapper()
          .find("#newResearch-mining")
          .exists(),
      ).toEqual(false);
      expect(
        wrapper()
          .find("#researchMiningButton")
          .exists(),
      ).toEqual(false);
      expect(
        wrapper()
          .find(LabRender)
          .props().completion,
      ).toEqual(3 / 5);
      step(3);
      expect(
        wrapper()
          .find("#newResearch-mining")
          .text(),
      ).toEqual("mining");
      expect(
        wrapper()
          .find(LabRender)
          .props().completion,
      ).toEqual(null);
    });

    it("doesn't allow to research, when minion is not 'idle'", () => {
      scene().focusedMinion().position = cloneDeep(
        scene().objects.lab.position,
      );
      scene().focusedMinion().status = {
        tag: "moving",
        target: { x: 100, y: 0 },
      };
      expect(scene().objects.lab.buttons()).toEqual([]);
    });
  });

  describe("auto-mining", () => {
    const setMinionPosition = (position: Vector): void => {
      scene().focusedMinion().position = cloneDeep(position);
      step(0.01);
    };

    it("allows to research auto-mining", () => {
      scene().objects.lab.researched.add("mining");
      scene().inventory = config().costs.research["auto-mining"];
      setMinionPosition(scene().objects.lab.position);
      wrapper()
        .find("#researchAutoMiningButton")
        .simulate("click");
      sendMinion(scene, { x: 0, y: 10000 });
      step(10);
      expect(
        wrapper()
          .find("#newResearch-auto-mining")
          .text(),
      ).toEqual("auto-mining");
    });

    test("auto-mining depends on mining", () => {
      setMinionPosition(scene().objects.lab.position);
      expect(
        wrapper()
          .find("#researchAutoMiningButton")
          .exists(),
      ).toEqual(false);
      scene().objects.lab.researched.add("mining");
      step(0.01);
      expect(
        wrapper()
          .find("#researchAutoMiningButton")
          .exists(),
      ).toEqual(true);
      scene().objects.lab.researched.add("auto-mining");
      step(0.01);
      expect(
        wrapper()
          .find("#researchAutoMiningButton")
          .exists(),
      ).toEqual(false);
    });

    it("researching auto-mining costs resources", () => {
      scene().objects.lab.researched.add("mining");
      config().costs.research["auto-mining"] = fromInt(5);
      config().researchVelocity = rational(1, 5);
      setMinionPosition(scene().objects.lab.position);
      expect(
        wrapper()
          .find("#researchAutoMiningButton")
          .props().disabled,
      ).toEqual(true);
      scene().inventory = fromInt(5);
      step(0.1);
      expect(
        wrapper()
          .find("#researchAutoMiningButton")
          .props().disabled,
      ).toEqual(false);
      wrapper()
        .find("#researchAutoMiningButton")
        .simulate("click");
      sendMinion(scene, { x: 0, y: 10000 });
      step(1);
      expect(scene().inventory.toNumber()).toEqual(4);
      step(4);
      expect(scene().inventory.toNumber()).toEqual(0);
    });

    it("doesn't overconsume inventory", () => {
      scene().objects.lab.researched.add("mining");
      config().costs.research["auto-mining"] = rational(1, 10);
      config().researchVelocity = fromInt(3);
      scene().inventory = fromInt(1);
      setMinionPosition(scene().objects.lab.position);
      step(0.1);
      wrapper()
        .find("#researchAutoMiningButton")
        .simulate("click");
      sendMinion(scene, { x: 0, y: 10000 });
      step(10);
      expect(scene().inventory.toNumber()).toEqual(0.9);
    });

    it("displays the research cost on the button", () => {
      scene().objects.lab.researched.add("mining");
      config().costs.research["auto-mining"] = fromInt(42);
      setMinionPosition(scene().objects.lab.position);
      expect(
        wrapper()
          .find("#researchAutoMiningButton")
          .text(),
      ).toContain(`(cost: ${42})`);
    });

    describe("when auto-mining is not researched", () => {
      it("doesn't switch to mining when colliding with a resource", () => {
        scene().objects.lab.researched.add("mining");
        setMinionPosition(scene().objects.lab.position);
        expect(scene().focusedMinion().status.tag).toEqual("idle");
      });
    });

    describe("when auto-mining is researched", () => {
      it("switches to mining when colliding with a resource", () => {
        scene().objects.lab.researched.add("mining");
        scene().objects.lab.researched.add("auto-mining");
        setMinionPosition(unsafeGet(scene().objects.resources, 0).position);
        step(0.5);
        expect(scene().focusedMinion().status.tag).toEqual("mining");
      });

      it("switches back to the previous status after mining is done", () => {
        config().velocity = 0.0;
        config().stepTimeDelta = rational(1, 10);
        scene().objects.lab.researched.add("mining");
        scene().objects.lab.researched.add("auto-mining");
        setMinionPosition(unsafeGet(scene().objects.resources, 0).position);
        scene().focusedMinion().status = {
          tag: "moving",
          target: { x: 100000, y: 0 },
        };
        step(0.1);
        expect(scene().focusedMinion().status.tag).toEqual("mining");
        step(2);
        expect(scene().focusedMinion().status.tag).toEqual("moving");
      });
    });
  });
});
