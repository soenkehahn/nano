// @flow

import { MinionRender, type RenderProps } from "./minion";
import { Resource, ResourceRender } from "./resource";
import { cloneDeep } from "lodash";
import { rational } from "./rational";
import { setupSceneWrapper, setupTestConfig } from "./test/utils";
import { toClickEvent } from "./vector";

const testConfig = setupTestConfig();

describe("Resource in scene", () => {
  beforeEach(() => {
    testConfig().velocity = 99999999999999;
  });

  const [wrapper, scene] = setupSceneWrapper(testConfig);

  describe("when only one resource exists", () => {
    let minionProps: RenderProps;
    let resourceProps: RenderProps;

    beforeEach(() => {
      scene().objects.resources = [scene().objects.resources[0]];
      wrapper().setProps({ timeDelta: 1 });
      minionProps = wrapper()
        .find(MinionRender)
        .props();
      resourceProps = wrapper()
        .find(ResourceRender)
        .props();
    });

    it("doesn't deplete a resource when mining is not researched", () => {
      wrapper()
        .find("#moveButton")
        .simulate("click");
      wrapper()
        .find("svg")
        .simulate("click", toClickEvent(resourceProps.position));
      wrapper().setProps({ timeDelta: 1 });
      expect(
        wrapper()
          .find("#mineButton-0")
          .exists(),
      ).toEqual(false);
      expect(
        wrapper()
          .find(ResourceRender)
          .exists(),
      ).toEqual(true);
    });

    describe("when mining is researched", () => {
      beforeEach(() => {
        scene().objects.lab.researched.add("mining");
      });

      it("allows to mine a resource when colliding (same position) with a minion", () => {
        wrapper()
          .find("#moveButton")
          .simulate("click");
        wrapper()
          .find("svg")
          .simulate("click", toClickEvent(resourceProps.position));
        wrapper().setProps({ timeDelta: 1 });
        expect(
          wrapper()
            .find(ResourceRender)
            .exists(),
        ).toEqual(true);
        wrapper()
          .find("#mineButton-0")
          .simulate("click");
        wrapper().setProps({ timeDelta: 1 });
        expect(
          wrapper()
            .find(ResourceRender)
            .exists(),
        ).toEqual(false);
      });

      it("depletes a resource when colliding slightly with a minion", () => {
        wrapper()
          .find("#moveButton")
          .simulate("click");
        wrapper()
          .find("svg")
          .simulate(
            "click",
            toClickEvent({
              x:
                resourceProps.position.x -
                (resourceProps.radius + minionProps.radius) +
                0.1,
              y: resourceProps.position.y,
            }),
          );
        wrapper().setProps({ timeDelta: 1 });
        wrapper()
          .find("#mineButton-0")
          .simulate("click");
        wrapper().setProps({ timeDelta: 1 });
        expect(
          wrapper()
            .find(ResourceRender)
            .exists(),
        ).toEqual(false);
      });

      it("doesn't allow to mine when near a minion", () => {
        wrapper()
          .find("#moveButton")
          .simulate("click");
        wrapper()
          .find("svg")
          .simulate(
            "click",
            toClickEvent({
              x:
                resourceProps.position.x -
                (resourceProps.radius + minionProps.radius) -
                0.1,
              y: resourceProps.position.y,
            }),
          );
        wrapper().setProps({ timeDelta: 1 });
        expect(
          wrapper()
            .find("#mineButton-0")
            .exists(),
        ).toEqual(false);
        expect(
          wrapper()
            .find(ResourceRender)
            .exists(),
        ).toEqual(true);
      });

      it("initializes an empty inventory", () => {
        expect(
          wrapper()
            .find("#inventory")
            .text(),
        ).toEqual("resources: 0");
      });

      it("increases the inventory resource counter", () => {
        wrapper()
          .find("#moveButton")
          .simulate("click");
        wrapper()
          .find("svg")
          .simulate("click", toClickEvent(resourceProps.position));
        wrapper().setProps({ timeDelta: 1 });
        wrapper()
          .find("#mineButton-0")
          .simulate("click");
        wrapper().setProps({ timeDelta: 1 });
        expect(
          wrapper()
            .find("#inventory")
            .text(),
        ).toEqual("resources: 1");
      });

      test("mining takes time", () => {
        testConfig().miningVelocity = rational(1, 2);
        wrapper()
          .find("#moveButton")
          .simulate("click");
        wrapper()
          .find("svg")
          .simulate("click", toClickEvent(resourceProps.position));
        wrapper().setProps({ timeDelta: 1 });
        wrapper()
          .find("#mineButton-0")
          .simulate("click");
        wrapper().setProps({ timeDelta: 0.5 });
        expect(
          wrapper()
            .find(ResourceRender)
            .props().radius,
        ).toEqual(7.5);
        expect(
          wrapper()
            .find("#status")
            .text(),
        ).toEqual("status: mining...");
      });

      test("mining will increase the inventory by fractions", () => {
        testConfig().miningVelocity = rational(1, 2);
        testConfig().stepTimeDelta = rational(1, 10);
        wrapper()
          .find("#moveButton")
          .simulate("click");
        wrapper()
          .find("svg")
          .simulate("click", toClickEvent(resourceProps.position));
        wrapper().setProps({ timeDelta: 1 });
        wrapper()
          .find("#mineButton-0")
          .simulate("click");
        wrapper().setProps({ timeDelta: 1 });
        expect(scene().inventory.toNumber()).toEqual(50);
      });

      test("a low stepTimeDelta doesn't screw up the inventory", () => {
        testConfig().miningVelocity = rational(1, 2);
        testConfig().stepTimeDelta = rational(1, 100);
        wrapper()
          .find("#moveButton")
          .simulate("click");
        wrapper()
          .find("svg")
          .simulate("click", toClickEvent(resourceProps.position));
        wrapper().setProps({ timeDelta: 1 });
        wrapper()
          .find("#mineButton-0")
          .simulate("click");
        wrapper().setProps({ timeDelta: 2 });
        expect(scene().inventory.toNumber()).toEqual(100);
      });

      it("stops mining when the minion doesn't collide with the resource anymore", () => {
        testConfig().miningVelocity = rational(1, 2);
        testConfig().stepTimeDelta = rational(1, 10);
        wrapper()
          .find("#moveButton")
          .simulate("click");
        const target = cloneDeep(resourceProps.position);
        target.x += Resource.initialRadius + scene().objects.minion.radius - 1;
        wrapper()
          .find("svg")
          .simulate("click", toClickEvent(target));
        wrapper().setProps({ timeDelta: 1 });
        wrapper()
          .find("#mineButton-0")
          .simulate("click");
        wrapper().setProps({ timeDelta: 3 });
        expect(
          wrapper()
            .find(ResourceRender)
            .props().radius,
        ).toEqual(9);
        expect(
          wrapper()
            .find("#moveButton")
            .exists(),
        ).toEqual(true);
      });
    });
  });
});

describe("Resource", () => {
  describe("mine", () => {
    let resource;

    beforeEach(() => {
      resource = new Resource({ x: 0, y: 0 });
    });

    it("allows to mine a fraction", () => {
      expect(resource.mine(rational(1, 10)).toNumber()).toEqual(10);
    });

    it("doesn't allow to mine more than 1", () => {
      expect(resource.mine(rational(11, 10)).toNumber()).toEqual(100);
    });

    it("allows to mine in multiple steps", () => {
      expect(resource.mine(rational(1, 2)).toNumber()).toEqual(50);
      expect(resource.mine(rational(6, 10)).toNumber()).toEqual(50);
    });
  });
});
