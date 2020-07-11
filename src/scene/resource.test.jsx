// @flow

import { IdMap } from "../data/IdMap";
import { Minion, MinionRender, type RenderProps } from "./minion";
import { Resource, ResourceRender } from "./resource";
import { cloneDeep } from "lodash";
import { fromInt, rational } from "../data/rational";
import { setupSceneWrapper, setupTestConfig } from "../test/utils";
import { toClickEvent } from "../data/vector";

const config = setupTestConfig();

describe("Resource in scene", () => {
  const { wrapper, scene, update, step } = setupSceneWrapper(config);

  let minionProps: RenderProps;
  let resourceProps: RenderProps;

  beforeEach(() => {
    config().velocity = fromInt(1000);
    scene().objects.resources = new IdMap([
      new Resource({ x: 100, y: 0 }),
      new Resource({ x: 200, y: 0 }),
    ]);
    update();
    minionProps = wrapper().find(MinionRender).props();
    resourceProps = wrapper().find(ResourceRender).props();
  });

  it("allows to mine a resource when colliding (same position) with a minion", () => {
    wrapper().find("#moveButton-0").simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent(resourceProps.position));
    step(2);
    expect(wrapper().find(ResourceRender).exists()).toEqual(true);
    wrapper().find("#mineButton-0").simulate("click");
    step(2);
    expect(wrapper().find(ResourceRender).exists()).toEqual(false);
  });

  it("shows multiple mine buttons for multiple minions", () => {
    scene().objects.resources = new IdMap([
      new Resource({ x: 200, y: 0 }),
      new Resource({ x: 200, y: 100 }),
    ]);
    scene().objects.minions.add(
      new Minion(config(), scene(), { x: 100, y: 0 }),
    );
    update();
    wrapper().find("#moveButton-0").simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 200, y: 0 }));
    wrapper().find("#moveButton-1").simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 200, y: 100 }));
    step(2);
    wrapper().find("#mineButton-0").simulate("click");
    wrapper().find("#mineButton-1").simulate("click");
    step();
    expect(scene().objects.resources.size()).toEqual(0);
  });

  it("depletes a resource when colliding slightly with a minion", () => {
    wrapper().find("#moveButton-0").simulate("click");
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
    step(2);
    wrapper().find("#mineButton-0").simulate("click");
    step(2);
    expect(wrapper().find(ResourceRender).exists()).toEqual(false);
  });

  it("doesn't allow to mine when near a minion", () => {
    wrapper().find("#moveButton-0").simulate("click");
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
    step(2);
    expect(wrapper().find("#mineButton-0").exists()).toEqual(false);
    expect(wrapper().find(ResourceRender).exists()).toEqual(true);
  });

  it("initializes an empty inventory", () => {
    expect(wrapper().find("#inventory").text()).toEqual("resources: 0.00");
  });

  it("increases the inventory resource counter", () => {
    wrapper().find("#moveButton-0").simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent(resourceProps.position));
    step(2);
    wrapper().find("#mineButton-0").simulate("click");
    step(2);
    expect(wrapper().find("#inventory").text()).toEqual("resources: 1.00");
  });

  test("mining takes time", () => {
    config().miningVelocity = rational(1, 2);
    wrapper().find("#moveButton-0").simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent(resourceProps.position));
    step(2);
    wrapper().find("#mineButton-0").simulate("click");
    step();
    expect(wrapper().find(ResourceRender).props().radius).toEqual(7.5);
    expect(wrapper().find("#minion-ui-0").text()).toEqual("status: mining...");
  });

  test("mining will increase the inventory by fractions", () => {
    config().miningVelocity = rational(1, 2);
    config().stepTimeDelta = rational(1, 10);
    wrapper().find("#moveButton-0").simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent(resourceProps.position));
    step(10);
    wrapper().find("#mineButton-0").simulate("click");
    step(10);
    expect(scene().inventory.toNumber()).toEqual(0.5);
  });

  test("a low stepTimeDelta doesn't screw up the inventory", () => {
    config().miningVelocity = rational(1, 2);
    config().stepTimeDelta = rational(1, 100);
    wrapper().find("#moveButton-0").simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent(resourceProps.position));
    step(100);
    wrapper().find("#mineButton-0").simulate("click");
    step(200);
    expect(scene().inventory.toNumber()).toEqual(1);
  });

  it("stops mining when the minion doesn't collide with the resource anymore", () => {
    config().miningVelocity = rational(1, 2);
    config().stepTimeDelta = rational(1, 10);
    wrapper().find("#moveButton-0").simulate("click");
    const target = cloneDeep(resourceProps.position);
    target.x += Resource.initialRadius + Minion.radius - 1;
    wrapper().find("svg").simulate("click", toClickEvent(target));
    step(10);
    wrapper().find("#mineButton-0").simulate("click");
    step(30);
    expect(wrapper().find(ResourceRender).props().radius).toEqual(9);
    expect(wrapper().find("#moveButton-0").exists()).toEqual(true);
  });
});

describe("Resource", () => {
  describe("mine", () => {
    let resource;

    beforeEach(() => {
      resource = new Resource({ x: 0, y: 0 });
    });

    it("allows to mine a fraction", () => {
      expect(resource.mine(rational(1, 10)).toNumber()).toEqual(0.1);
    });

    it("doesn't allow to mine more than 1", () => {
      expect(resource.mine(rational(11, 10)).toNumber()).toEqual(1);
    });

    it("allows to mine in multiple steps", () => {
      expect(resource.mine(rational(1, 2)).toNumber()).toEqual(0.5);
      expect(resource.mine(rational(6, 10)).toNumber()).toEqual(0.5);
    });
  });
});
