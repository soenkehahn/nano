// @flow

import { IdMap } from "../data/IdMap";
import { Minion, MinionRender } from "./minion";
import { Resource } from "./resource";
import { fromInt, rational } from "../data/rational";
import { sendMinion, setupSceneWrapper, setupTestConfig } from "../test/utils";
import { toClickEvent } from "../data/vector";

const config = setupTestConfig();

const { wrapper, scene, update, step } = setupSceneWrapper(config);

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
    step(200);
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
        .find("#moveButton-0")
        .simulate("click");
      wrapper()
        .find("svg")
        .simulate("click", toClickEvent({ x: 10, y: 10 }));
      step(200);
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
        .find("#moveButton-0")
        .simulate("click");
      wrapper()
        .find("svg")
        .simulate("click", toClickEvent({ x: 10, y: 0 }));
      step(2);
      wrapper()
        .find("svg")
        .simulate("click", toClickEvent({ x: 20, y: 0 }));
      step(200);
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
        .find("#moveButton-0")
        .simulate("click");
      step(2);
      expect(
        wrapper()
          .find("#minion-ui-0")
          .text(),
      ).toEqual("click on the map to set the target");
    });
  });

  it("minions need time to move around", () => {
    scene().focusedMinion().position = { x: 0, y: 0 };
    wrapper()
      .find("#moveButton-0")
      .simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 1, y: 0 }));
    step();
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
    update();
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
    update();
    expect(
      wrapper()
        .find(MinionRender)
        .map(x => x.props().focused),
    ).toEqual([true, false]);
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 100, y: 0 }));
    update();
    expect(
      wrapper()
        .find(MinionRender)
        .map(x => x.props().focused),
    ).toEqual([false, true]);
  });

  it("allows to move the second minion", () => {
    config().velocity = fromInt(100);
    scene().objects.minions.add(
      new Minion(config(), scene(), { x: 100, y: 0 }),
    );
    sendMinion(scene, { x: 0, y: 100 });
    update();
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 100, y: 0 }));
    update();
    wrapper()
      .find("#moveButton-1")
      .simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 100, y: 100 }));
    step(2);
    expect(
      wrapper()
        .find(MinionRender)
        .map(x => x.props().position),
    ).toEqual([{ x: 0, y: 100 }, { x: 100, y: 100 }]);
  });

  it("keeps moving unfocused minions", () => {
    scene().objects.minions.add(
      new Minion(config(), scene(), { x: 100, y: 0 }),
    );
    const [minionA, minionB] = scene().objects.minions.minions;
    minionA.status = { tag: "moving", target: { x: 0, y: 100 } };
    minionB.status = { tag: "moving", target: { x: 100, y: 100 } };
    update();
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 100, y: 0 }));
    step(2);
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
    scene().objects.minions.add(
      new Minion(config(), scene(), { x: 100, y: 0 }),
    );
    scene().objects.resources = new IdMap([
      new Resource({ x: 0, y: 0 }),
      new Resource({ x: 100, y: 0 }),
    ]);
    step();
    wrapper()
      .find("#mineButton-0")
      .simulate("click");
    step(5);
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 100, y: 0 }));
    step();
    wrapper()
      .find("#mineButton-1")
      .simulate("click");
    step();
    expect(
      scene().objects.minions.minions.map(minion => minion.status.tag),
    ).toEqual(["mining", "mining"]);
    step(10);
    expect(scene().inventory.toNumber()).toEqual(2);
  });

  it("shows the status of a minion", () => {
    expect(
      wrapper()
        .find("#minion-ui-0")
        .text(),
    ).toContain("status: idle");
  });

  it("shows the status of moving minions", () => {
    wrapper()
      .find("#moveButton-0")
      .simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 1, y: 0 }));
    step();
    expect(
      wrapper()
        .find("#minion-ui-0")
        .text(),
    ).toContain("status: moving");
  });

  describe("focus buttons", () => {
    it("shows a focus button", () => {
      expect(
        wrapper()
          .find("#focusButton-0")
          .exists(),
      ).toEqual(true);
    });

    describe("when there are two minions", () => {
      beforeEach(() => {
        scene().objects.minions.add(
          new Minion(config(), scene(), { x: 3, y: 4 }),
        );
        update();
      });

      it("shows a focus button for the unfocused minion", () => {
        expect(
          wrapper()
            .find("#focusButton-1")
            .exists(),
        ).toEqual(true);
      });

      it("allows to switch focus to the unfocused minion", () => {
        wrapper()
          .find("#focusButton-1")
          .simulate("click");
        expect(scene().focusedMinion().id).toEqual(1);
      });

      it("centers the view on the new focused minion", () => {
        wrapper()
          .find("#focusButton-1")
          .simulate("click");
        update();
        expect(
          wrapper()
            .find("svg")
            .props().viewBox,
        ).toEqual("-97 -96 200 200");
      });

      it("shows two move buttons", () => {
        expect(
          wrapper()
            .find("#moveButton-0")
            .exists(),
        ).toEqual(true);
        expect(
          wrapper()
            .find("#moveButton-1")
            .exists(),
        ).toEqual(true);
      });

      it("allows to move two minions at the same time", () => {
        config().velocity = fromInt(100);
        wrapper()
          .find("#moveButton-0")
          .simulate("click");
        wrapper()
          .find("svg")
          .simulate("click", toClickEvent({ x: 100, y: 100 }));
        wrapper()
          .find("#moveButton-1")
          .simulate("click");
        wrapper()
          .find("svg")
          .simulate("click", toClickEvent({ x: -100, y: 100 }));
        step(3);
        expect(
          wrapper()
            .find(MinionRender)
            .map(x => x.props().position),
        ).toEqual([{ x: 100, y: 100 }, { x: -100, y: 100 }]);
      });
    });
  });
});
