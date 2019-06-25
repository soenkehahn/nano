// @flow

import { LabRender } from "./lab";
import { SvgPane } from "./svgPane";
import { type Vector, toClickEvent } from "./vector";
import { cloneDeep } from "lodash";
import { fromInt, rational } from "./rational";
import { setupSceneWrapper, setupTestConfig } from "./test/utils";

const testConfig = setupTestConfig();

describe("Lab", () => {
  beforeEach(() => {
    testConfig().velocity = 1000;
    testConfig().miningVelocity = fromInt(1);
  });

  const [wrapper, scene] = setupSceneWrapper(testConfig);

  beforeEach(() => {
    wrapper()
      .find(SvgPane)
      .simulate("wheel", { clientX: 0, clientY: 0, deltaY: 100 });
    wrapper().setProps({ timeDelta: 1 });
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
      wrapper().setProps({ timeDelta: 1 });
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
      wrapper().setProps({ timeDelta: 10 });
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
      wrapper().setProps({ timeDelta: 1 });
      wrapper()
        .find("#researchMiningButton")
        .simulate("click");
      wrapper().setProps({ timeDelta: 10 });
      expect(
        wrapper()
          .find("#researchMiningButton")
          .exists(),
      ).toEqual(false);
    });

    test("researching takes time", () => {
      testConfig().researchVelocity = rational(1, 5);
      wrapper()
        .find("#moveButton")
        .simulate("click");
      wrapper()
        .find("svg")
        .simulate("click", toClickEvent(scene().objects.lab.position));
      wrapper().setProps({ timeDelta: 1 });
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
      wrapper().setProps({ timeDelta: 3 });
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
      wrapper().setProps({ timeDelta: 3 });
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
      scene().objects.minion.position = cloneDeep(scene().objects.lab.position);
      scene().objects.minion.status = { tag: "moving" };
      expect(scene().objects.lab.buttons()).toEqual([]);
    });
  });

  describe("auto-mining", () => {
    const setMinionPosition = (position: Vector): void => {
      scene().objects.minion.position = cloneDeep(position);
      scene().objects.minion.target = cloneDeep(position);
      wrapper().setProps({ timeDelta: 0.01 });
    };

    it("allows to research auto-mining", () => {
      scene().objects.lab.researched.add("mining");
      scene().inventory = testConfig().costs.research["auto-mining"];
      setMinionPosition(scene().objects.lab.position);
      wrapper()
        .find("#researchAutoMiningButton")
        .simulate("click");
      wrapper().setProps({ timeDelta: 10 });
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
      wrapper().setProps({ timeDelta: 0.01 });
      expect(
        wrapper()
          .find("#researchAutoMiningButton")
          .exists(),
      ).toEqual(true);
      scene().objects.lab.researched.add("auto-mining");
      wrapper().setProps({ timeDelta: 0.01 });
      expect(
        wrapper()
          .find("#researchAutoMiningButton")
          .exists(),
      ).toEqual(false);
    });

    it("researching auto-mining costs resources", () => {
      scene().objects.lab.researched.add("mining");
      testConfig().costs.research["auto-mining"] = fromInt(500);
      testConfig().researchVelocity = rational(1, 5);
      setMinionPosition(scene().objects.lab.position);
      expect(
        wrapper()
          .find("#researchAutoMiningButton")
          .props().disabled,
      ).toEqual(true);
      scene().inventory = fromInt(500);
      wrapper().setProps({ timeDelta: 0.1 });
      expect(
        wrapper()
          .find("#researchAutoMiningButton")
          .props().disabled,
      ).toEqual(false);
      wrapper()
        .find("#researchAutoMiningButton")
        .simulate("click");
      wrapper().setProps({ timeDelta: 1 });
      expect(scene().inventory.toNumber()).toEqual(400);
      wrapper().setProps({ timeDelta: 4 });
      expect(scene().inventory.toNumber()).toEqual(0);
    });

    it("doesn't overconsume inventory", () => {
      scene().objects.lab.researched.add("mining");
      testConfig().costs.research["auto-mining"] = fromInt(10);
      testConfig().researchVelocity = fromInt(3);
      scene().inventory = fromInt(100);
      setMinionPosition(scene().objects.lab.position);
      wrapper().setProps({ timeDelta: 0.1 });
      wrapper()
        .find("#researchAutoMiningButton")
        .simulate("click");
      wrapper().setProps({ timeDelta: 10 });
      expect(scene().inventory.toNumber()).toEqual(90);
    });

    it("displays the research cost on the button", () => {
      scene().objects.lab.researched.add("mining");
      testConfig().costs.research["auto-mining"] = fromInt(4200);
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
        expect(scene().objects.minion.status.tag).toEqual("idle");
      });
    });

    describe("when auto-mining is researched", () => {
      it("switches to mining when colliding with a resource", () => {
        scene().objects.lab.researched.add("mining");
        scene().objects.lab.researched.add("auto-mining");
        setMinionPosition(scene().objects.resources[0].position);
        wrapper().setProps({ timeDelta: 0.5 });
        expect(scene().objects.minion.status.tag).toEqual("mining");
      });

      it("switches back to the previous status after mining is done", () => {
        testConfig().velocity = 0.0;
        testConfig().stepTimeDelta = rational(1, 10);
        scene().objects.lab.researched.add("mining");
        scene().objects.lab.researched.add("auto-mining");
        setMinionPosition(scene().objects.resources[0].position);
        scene().objects.minion.status = { tag: "moving" };
        scene().objects.minion.target = { x: 100000, y: 0 };
        wrapper().setProps({ timeDelta: 0.1 });
        expect(scene().objects.minion.status.tag).toEqual("mining");
        wrapper().setProps({ timeDelta: 2 });
        expect(scene().objects.minion.status.tag).toEqual("moving");
      });
    });
  });
});
