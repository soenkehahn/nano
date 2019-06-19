// @flow

import { MinionRender, type RenderProps } from "./minion";
import { Resource, ResourceRender } from "./resource";
import { cloneDeep } from "lodash";
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
        .find("#goButton")
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
        scene().canMine = true;
      });

      it("allows to mine a resource when colliding (same position) with a minion", () => {
        wrapper()
          .find("#goButton")
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
          .find("#goButton")
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
          .find("#goButton")
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
          .find("#goButton")
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
        testConfig().miningVelocity = 0.5;
        wrapper()
          .find("#goButton")
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
        testConfig().miningVelocity = 0.5;
        testConfig().stepTimeDelta = 0.1;
        wrapper()
          .find("#goButton")
          .simulate("click");
        wrapper()
          .find("svg")
          .simulate("click", toClickEvent(resourceProps.position));
        wrapper().setProps({ timeDelta: 1 });
        wrapper()
          .find("#mineButton-0")
          .simulate("click");
        wrapper().setProps({ timeDelta: 1 });
        expect(scene().inventory).toEqual(50);
      });

      test("a low stepTimeDelta doesn't screw up the inventory", () => {
        testConfig().miningVelocity = 0.5;
        testConfig().stepTimeDelta = 0.01;
        wrapper()
          .find("#goButton")
          .simulate("click");
        wrapper()
          .find("svg")
          .simulate("click", toClickEvent(resourceProps.position));
        wrapper().setProps({ timeDelta: 1 });
        wrapper()
          .find("#mineButton-0")
          .simulate("click");
        wrapper().setProps({ timeDelta: 2 });
        expect(scene().inventory).toEqual(100);
      });

      it("stops mining when the minion doesn't collide with the resource anymore", () => {
        testConfig().miningVelocity = 0.5;
        testConfig().stepTimeDelta = 0.1;
        wrapper()
          .find("#goButton")
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
            .find("#goButton")
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

    it("allows to mine a fraction, returning the units", () => {
      expect(resource.mine(0.1)).toEqual(10);
    });

    it("doesn't allow to mine more than 1", () => {
      expect(resource.mine(1.1)).toEqual(100);
    });

    it("allows to mine in multiple steps", () => {
      expect(resource.mine(0.5)).toEqual(50);
      expect(resource.mine(0.6)).toEqual(50);
    });

    it("rounds to cents", () => {
      expect(resource.mine(0.123)).toEqual(12);
    });

    it("takes previous remainders into account", () => {
      expect(resource.mine(0.006)).toEqual(0);
      expect(resource.mine(0.006)).toEqual(1);
    });

    it("takes previous remainders into account at the end", () => {
      expect(resource.mine(0.996)).toEqual(99);
      expect(resource.mine(0.006)).toEqual(1);
    });
  });
});
