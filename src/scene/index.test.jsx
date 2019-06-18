// @flow

import { MinionRender, type RenderProps } from "../minion";
import { ResourceRender } from "../resource";
import { Scene, mkSceneRender } from "../scene";
import {
  mockSvgJsdomExtensions,
  setupSceneWrapper,
  setupTestConfig,
} from "../test/utils";
import { mount } from "enzyme";
import { toClickEvent } from "../vector";
import React from "react";

const testConfig = setupTestConfig();

describe("SceneRender", () => {
  describe("step function logic", () => {
    let timeDeltas;

    beforeEach(() => {
      timeDeltas = [];
    });

    function mkMockScene(): Scene {
      const scene = new Scene(testConfig());
      scene.step = (timeDelta: number) => {
        timeDeltas.push(timeDelta);
      };
      return scene;
    }

    it("calls the step function as often as needed to reach the timeDelta", () => {
      testConfig().stepTimeDelta = 1;
      const SceneRender = mkSceneRender(testConfig(), mkMockScene());
      const wrapper = mount(<SceneRender time={0} timeDelta={0} />);
      wrapper.setProps({ timeDelta: 10 });
      expect(timeDeltas.length).toEqual(10);
    });

    it("calls the step function with fixed timeDeltas", () => {
      testConfig().stepTimeDelta = 0.5;
      const Scene = mkSceneRender(testConfig(), mkMockScene());
      const wrapper = mount(<Scene time={0} timeDelta={0} />);
      wrapper.setProps({ timeDelta: 5 });
      for (const timeDelta of timeDeltas) {
        expect(timeDelta).toEqual(0.5);
      }
    });

    it("saves the remainder of the timeDelta for the next round", () => {
      testConfig().stepTimeDelta = 0.6;
      const Scene = mkSceneRender(testConfig(), mkMockScene());
      const wrapper = mount(<Scene time={0} timeDelta={0} />);
      wrapper.setProps({ timeDelta: 1 });
      expect(timeDeltas.length).toEqual(1);
      wrapper.setProps({ timeDelta: 1 });
      expect(timeDeltas.length).toEqual(3);
      wrapper.setProps({ timeDelta: 1 });
      expect(timeDeltas.length).toEqual(5);
      wrapper.setProps({ timeDelta: 1 });
      expect(timeDeltas.length).toEqual(6);
      wrapper.setProps({ timeDelta: 1 });
      expect(timeDeltas.length).toEqual(8);
      wrapper.setProps({ timeDelta: 1 });
      expect(timeDeltas.length).toEqual(10);
    });
  });
});

describe("Scene", () => {
  describe("interface", () => {
    const [wrapper, scene] = setupSceneWrapper(testConfig);

    it("takes the offset of the svg pane into account", () => {
      mockSvgJsdomExtensions(wrapper().find("svg"), { x: 2, y: 1 });
      wrapper()
        .find("#goButton")
        .simulate("click");
      wrapper()
        .find("svg")
        .simulate("click", toClickEvent({ x: 10, y: 10 }));
      wrapper().setProps({ timeDelta: 100 });
      expect(
        wrapper()
          .find(MinionRender)
          .props().position,
      ).toEqual({
        x: 8,
        y: 9,
      });
    });

    it("doesn't show the go button after being pressed", () => {
      wrapper()
        .find("#goButton")
        .simulate("click");
      wrapper().setProps({ timeDelta: 1 });
      expect(
        wrapper()
          .find("#goButton")
          .exists(),
      ).toEqual(false);
    });

    it("shows the go button after minion reaches target", () => {
      wrapper()
        .find("#goButton")
        .simulate("click");
      wrapper()
        .find("svg")
        .simulate("click", toClickEvent({ x: 10, y: 10 }));
      wrapper().setProps({ timeDelta: 100 });
      expect(
        wrapper()
          .find("#goButton")
          .exists(),
      ).toEqual(true);
    });

    it("doesn't show any buttons if the minion is not idle", () => {
      scene().inventory = 3;
      wrapper()
        .find("#goButton")
        .simulate("click");
      wrapper().setProps({ timeDelta: 1 });
      expect(
        wrapper()
          .find("#goButton")
          .exists(),
      ).toEqual(false);
      expect(
        wrapper()
          .find("#buildButton")
          .exists(),
      ).toEqual(false);
    });

    describe("active command", () => {
      it("initially shows no active command", () => {
        expect(
          wrapper()
            .find("#activeCommand")
            .text(),
        ).toEqual("active command: none");
      });

      it("shows the active command", () => {
        wrapper()
          .find("#goButton")
          .simulate("click");
        wrapper()
          .find("svg")
          .simulate("click", toClickEvent({ x: 10, y: 10 }));
        wrapper().setProps({ timeDelta: 1 });
        expect(
          wrapper()
            .find("#activeCommand")
            .text(),
        ).toEqual("active command: go");
      });
    });
  });

  describe("Minion", () => {
    const [wrapper, scene] = setupSceneWrapper(testConfig);

    it("shows minion in svg context", () => {
      expect(
        wrapper()
          .find("svg")
          .find(MinionRender)
          .exists(),
      ).toEqual(true);
    });

    it("doesn't allow to set the minion coordinates with a mouse click", async () => {
      scene().objects.minion.position = { x: 0, y: 0 };
      wrapper()
        .find("svg")
        .simulate("click", toClickEvent({ x: 10, y: 10 }));
      wrapper().setProps({ timeDelta: 100 });
      expect(
        wrapper()
          .find(MinionRender)
          .props().position,
      ).toEqual({
        x: 0,
        y: 0,
      });
    });

    describe("after pressing 'go'", () => {
      it("allows to set the minion coordinates with a mouse click", async () => {
        wrapper()
          .find("#goButton")
          .simulate("click");
        wrapper()
          .find("svg")
          .simulate("click", toClickEvent({ x: 10, y: 10 }));
        wrapper().setProps({ timeDelta: 100 });
        expect(
          wrapper()
            .find(MinionRender)
            .props().position,
        ).toEqual({
          x: 10,
          y: 10,
        });
      });

      it("doesn't allow to change the minion target while it's underway", async () => {
        wrapper()
          .find("#goButton")
          .simulate("click");
        wrapper()
          .find("svg")
          .simulate("click", toClickEvent({ x: 10, y: 0 }));
        wrapper().setProps({ timeDelta: 1 });
        wrapper()
          .find("svg")
          .simulate("click", toClickEvent({ x: 20, y: 0 }));
        wrapper().setProps({ timeDelta: 100 });
        expect(
          wrapper()
            .find(MinionRender)
            .props().position,
        ).toEqual({
          x: 10,
          y: 0,
        });
      });
    });

    it("minions need time to move around", () => {
      scene().objects.minion.position = { x: 0, y: 0 };
      wrapper()
        .find("#goButton")
        .simulate("click");
      wrapper()
        .find("svg")
        .simulate("click", toClickEvent({ x: 1, y: 0 }));
      wrapper().setProps({ timeDelta: 0.5 });
      expect(
        wrapper()
          .find(MinionRender)
          .props().position,
      ).toEqual({
        x: 0.5,
        y: 0,
      });
    });
  });

  describe("Resource", () => {
    beforeEach(() => {
      testConfig().velocity = 99999999999999;
    });

    const [wrapper, scene] = setupSceneWrapper(testConfig);

    it("shows multiple resources", () => {
      expect(wrapper().find(ResourceRender).length).toBeGreaterThan(5);
    });

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
            .find("#mineButton")
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
            .find("#mineButton")
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
                  (resourceProps.size + minionProps.size) +
                  0.1,
                y: resourceProps.position.y,
              }),
            );
          wrapper().setProps({ timeDelta: 1 });
          wrapper()
            .find("#mineButton")
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
                  (resourceProps.size + minionProps.size) -
                  0.1,
                y: resourceProps.position.y,
              }),
            );
          wrapper().setProps({ timeDelta: 1 });
          expect(
            wrapper()
              .find("#mineButton")
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
          ).toEqual("resource: 0");
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
            .find("#mineButton")
            .simulate("click");
          wrapper().setProps({ timeDelta: 1 });
          expect(
            wrapper()
              .find("#inventory")
              .text(),
          ).toEqual("resource: 1");
        });
      });
    });
  });
});
