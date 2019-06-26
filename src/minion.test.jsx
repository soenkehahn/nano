// @flow

import { Minion, MinionRender } from "./minion";
import { setupSceneWrapper, setupTestConfig } from "./test/utils";
import { toClickEvent } from "./vector";

const config = setupTestConfig();

const [wrapper, scene] = setupSceneWrapper(config);

describe("Minion", () => {
  it("shows minion in svg context", () => {
    expect(
      wrapper()
        .find("svg")
        .find(MinionRender)
        .exists(),
    ).toEqual(true);
  });

  it("doesn't allow to set the minion coordinates with a mouse click", async () => {
    scene().focusedMinion().position = { x: 0, y: 0 };
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
    scene().focusedMinion().position = { x: 0, y: 0 };
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

describe("Minions", () => {
  it("renders multiple minions", () => {
    scene().objects.minions.add(new Minion(config(), { x: 10, y: 10 }));
    wrapper().setProps({ timeDelta: 0.1 });
    expect(
      wrapper()
        .find(MinionRender)
        .map(x => x.props().position),
    ).toEqual([{ x: 0, y: 0 }, { x: 10, y: 10 }]);
  });

  it("allows to switch the focused minion", () => {
    scene().objects.minions.add(new Minion(config(), { x: 100, y: 0 }));
    wrapper().setProps({ timeDelta: 0.1 });
    expect(
      wrapper()
        .find(MinionRender)
        .map(x => x.props().focused),
    ).toEqual([true, false]);
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 100, y: 0 }));
    wrapper().setProps({ timeDelta: 0.1 });
    expect(
      wrapper()
        .find(MinionRender)
        .map(x => x.props().focused),
    ).toEqual([false, true]);
  });

  it("allows to move the focused minion", () => {
    config().velocity = 100;
    scene().objects.minions.add(new Minion(config(), { x: 100, y: 0 }));
    wrapper().setProps({ timeDelta: 0.1 });
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 100, y: 0 }));
    wrapper().setProps({ timeDelta: 0.1 });
    wrapper()
      .find("#moveButton")
      .simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 100, y: 100 }));
    wrapper().setProps({ timeDelta: 1 });
    expect(
      wrapper()
        .find(MinionRender)
        .map(x => x.props().position),
    ).toEqual([{ x: 0, y: 0 }, { x: 100, y: 100 }]);
  });

  it("moves unfocused minions", () => {
    scene().objects.minions.add(new Minion(config(), { x: 100, y: 0 }));
    wrapper().setProps({ timeDelta: 0.1 });
    wrapper()
      .find("#moveButton")
      .simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 0, y: 100 }));
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 100, y: 0 }));
    wrapper().setProps({ timeDelta: 1 });
    expect(
      wrapper()
        .find(MinionRender)
        .at(0)
        .props().position,
    ).toEqual({ x: 0, y: 1 });
  });
});
