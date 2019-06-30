// @flow

import { Minion, MinionRender } from "./minion";
import { Resource } from "./resource";
import { fromInt, rational } from "./rational";
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
    scene().objects.minions.add(
      new Minion(config(), scene(), { x: 10, y: 10 }),
    );
    wrapper().setProps({ timeDelta: 0.1 });
    expect(
      wrapper()
        .find(MinionRender)
        .map(x => x.props().position),
    ).toEqual([{ x: 0, y: 0 }, { x: 10, y: 10 }]);
  });

  it("allows to switch the focused minion", () => {
    scene().objects.minions.add(
      new Minion(config(), scene(), { x: 100, y: 0 }),
    );
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
    scene().objects.minions.add(
      new Minion(config(), scene(), { x: 100, y: 0 }),
    );
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

  it("keeps moving unfocused minions", () => {
    scene().objects.minions.add(
      new Minion(config(), scene(), { x: 100, y: 0 }),
    );
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

  it("keeps unfocused minions in mining mode", () => {
    config().stepTimeDelta = rational(1, 10);
    config().miningVelocity = fromInt(1);
    scene().objects.lab.researched.add("mining");
    scene().objects.minions.add(
      new Minion(config(), scene(), { x: 100, y: 0 }),
    );
    scene().objects.resources = new Map([
      [0, new Resource({ x: 0, y: 0 })],
      [1, new Resource({ x: 100, y: 0 })],
    ]);
    wrapper().setProps({ timeDelta: 0.1 });
    wrapper()
      .find("#mineButton")
      .simulate("click");
    wrapper().setProps({ timeDelta: 0.5 });
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 100, y: 0 }));
    wrapper().setProps({ timeDelta: 0.1 });
    wrapper()
      .find("#mineButton")
      .simulate("click");
    wrapper().setProps({ timeDelta: 0.1 });
    expect(
      scene().objects.minions.minions.map(minion => minion.status.tag),
    ).toEqual(["mining", "mining"]);
    wrapper().setProps({ timeDelta: 1 });
    expect(scene().inventory.toNumber()).toEqual(2);
  });

  it("shows the number of minions", () => {
    for (let i = 0; i < 22; i++) {
      scene().objects.minions.add(
        new Minion(config(), scene(), { x: 0, y: 0 }),
      );
    }
    wrapper().setProps({ timeDelta: 0.1 });
    expect(
      wrapper()
        .find("#interface")
        .text(),
    ).toContain("minions: 23");
  });

  describe("idle buttons", () => {
    it("shows a idle button for an idle minion", () => {
      expect(
        wrapper()
          .find("#idleButton-0")
          .exists(),
      ).toEqual(true);
    });

    it("includes the minion id in the button text", () => {
      scene().focusedMinion().id = 42;
      wrapper().setProps({ timeDelta: 0.1 });
      expect(
        wrapper()
          .find("#idleButton-42")
          .text(),
      ).toEqual("minion #42");
    });

    it("hides the idle button when the minion is moving", () => {
      scene().focusedMinion().status = {
        tag: "moving",
        target: { x: 100, y: 0 },
      };
      wrapper().setProps({ timeDelta: 0.1 });
      expect(
        wrapper()
          .find("#idleButton-0")
          .exists(),
      ).toEqual(false);
    });

    describe("when there are two minions", () => {
      beforeEach(() => {
        scene().objects.minions.add(
          new Minion(config(), scene(), { x: 3, y: 4 }),
        );
        wrapper().setProps({ timeDelta: 0.1 });
      });

      it("shows an idle button for the unfocused minion", () => {
        expect(
          wrapper()
            .find("#idleButton-1")
            .exists(),
        ).toEqual(true);
      });

      it("allows to switch focus to the unfocused minion", () => {
        wrapper()
          .find("#idleButton-1")
          .simulate("click");
        expect(scene().focusedMinion().id).toEqual(1);
      });

      it("centers the view on the new focused minion", () => {
        wrapper()
          .find("#idleButton-1")
          .simulate("click");
        wrapper().setProps({ timeDelta: 0.1 });
        expect(
          wrapper()
            .find("svg")
            .props().viewBox,
        ).toEqual("-97 -96 200 200");
      });
    });
  });
});
