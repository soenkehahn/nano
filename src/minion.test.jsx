// @flow

import { MinionRender } from "./minion";
import { setupSceneWrapper, setupTestConfig } from "./test/utils";
import { toClickEvent } from "./vector";

const testConfig = setupTestConfig();

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

  describe("after pressing 'move'", () => {
    it("allows to set the minion coordinates with a mouse click", async () => {
      wrapper()
        .find("#moveButton")
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
        .find("#moveButton")
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

    it("shows a message about to click on the map", async () => {
      wrapper()
        .find("#moveButton")
        .simulate("click");
      wrapper().setProps({ timeDelta: 1 });
      expect(
        wrapper()
          .find("#status")
          .text(),
      ).toEqual("click on the map to set the target");
    });
  });

  it("minions need time to move around", () => {
    scene().objects.minion.position = { x: 0, y: 0 };
    wrapper()
      .find("#moveButton")
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
