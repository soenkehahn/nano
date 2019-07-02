// @flow

import { fromInt, rational } from "./rational";

expect.extend({
  toEqualRational(a, b) {
    const pass = a.numerator === b.numerator && a.denominator === b.denominator;
    return {
      pass,
      message: () => this.utils.diff(a.toString(), b.toString()),
    };
  },
});

describe("fromInt", () => {
  it("converts to a Rational", () => {
    const rational = fromInt(42);
    expect(rational.numerator).toEqual(42);
    expect(rational.denominator).toEqual(1);
  });
});

describe("rational", () => {
  it("reduces rationals", () => {
    (expect(rational(2, 2)): any).toEqualRational(fromInt(1));
  });

  it("normalizes the sign", () => {
    expect(rational(-1, 1).toString()).toEqual("(-1) % (1)");
    expect(rational(1, -1).toString()).toEqual("(-1) % (1)");
  });
});

describe("equals", () => {
  const tests = [
    [fromInt(1), fromInt(1), true],
    [fromInt(2), fromInt(1), false],
    [fromInt(1), fromInt(2), false],
    [rational(1, 2), rational(1, 2), true],
    [rational(1, 2), rational(1, 3), false],
    [rational(1, 3), rational(2, 3), false],
    [rational(-1, 3), rational(1, -3), true],
    [rational(0, 1), rational(0, 2), true],
  ];

  for (let i = 0; i < tests.length; i++) {
    it(`equals (===) test #${i}`, () => {
      const [a, b, expected] = tests[i];
      if (a.equals(b) !== expected) {
        throw new Error(
          `${a.toString()}.equals(${b.toString()}) !== ${expected.toString()}`,
        );
      }
    });
  }
});

describe("ge", () => {
  const tests = [
    [fromInt(1), fromInt(1), true],
    [fromInt(2), fromInt(1), true],
    [fromInt(1), fromInt(2), false],
    [rational(1, 2), rational(1, 2), true],
    [rational(1, 2), rational(1, 3), true],
    [rational(1, 3), rational(1, 2), false],
    [rational(2, 3), rational(1, 3), true],
    [rational(1, 3), rational(2, 3), false],
    [rational(1, -3), rational(2, 3), false],
    [rational(-1, 3), rational(2, 3), false],
    [rational(1, 3), rational(-2, 3), true],
    [rational(1, 3), rational(2, -3), true],
    [rational(1, 3), rational(-2, -3), false],
    [rational(-1, 3), rational(2, -3), true],
  ];

  for (let i = 0; i < tests.length; i++) {
    it(`ge (>=) test #${i}`, () => {
      const [a, b, expected] = tests[i];
      if (a.ge(b) !== expected) {
        throw new Error(
          `${a.toString()}.ge(${b.toString()}) !== ${expected.toString()}`,
        );
      }
    });
  }
});

describe("gt", () => {
  const tests = [
    [fromInt(1), fromInt(1), false],
    [fromInt(2), fromInt(1), true],
    [fromInt(1), fromInt(2), false],
    [rational(2, 2), rational(3, 3), false],
    [rational(2, 2), rational(3, 3), false],
    [rational(2, -2), rational(-3, 3), false],
    [rational(1, 2), rational(1, 2), false],
    [rational(1, 2), rational(1, 3), true],
    [rational(1, 3), rational(1, 2), false],
    [rational(2, 3), rational(1, 3), true],
    [rational(1, 3), rational(2, 3), false],
    [rational(1, -3), rational(2, 3), false],
    [rational(-1, 3), rational(2, 3), false],
    [rational(1, 3), rational(-2, 3), true],
    [rational(1, 3), rational(2, -3), true],
    [rational(1, 3), rational(-2, -3), false],
    [rational(-1, 3), rational(2, -3), true],
  ];

  for (let i = 0; i < tests.length; i++) {
    it(`gt (>) test #${i}`, () => {
      const [a, b, expected] = tests[i];
      if (a.gt(b) !== expected) {
        throw new Error(
          `${a.toString()}.gt(${b.toString()}) !== ${expected.toString()}`,
        );
      }
    });
  }
});

describe("le", () => {
  const tests = [
    [fromInt(1), fromInt(1), true],
    [fromInt(2), fromInt(1), false],
    [fromInt(1), fromInt(2), true],
    [rational(1, 2), rational(1, 2), true],
    [rational(1, 2), rational(1, 3), false],
    [rational(1, 3), rational(1, 2), true],
    [rational(2, 3), rational(1, 3), false],
    [rational(1, 3), rational(2, 3), true],
    [rational(1, -3), rational(2, 3), true],
    [rational(-1, 3), rational(2, 3), true],
    [rational(1, 3), rational(-2, 3), false],
    [rational(1, 3), rational(2, -3), false],
    [rational(1, 3), rational(-2, -3), true],
    [rational(-1, 3), rational(2, -3), false],
  ];

  for (let i = 0; i < tests.length; i++) {
    it(`le (<=) test #${i}`, () => {
      const [a, b, expected] = tests[i];
      if (a.le(b) !== expected) {
        throw new Error(
          `${a.toString()}.le(${b.toString()}) !== ${expected.toString()}`,
        );
      }
    });
  }
});

describe("lt", () => {
  const tests = [
    [fromInt(1), fromInt(1), false],
    [fromInt(2), fromInt(1), false],
    [fromInt(1), fromInt(2), true],
    [rational(2, 2), rational(3, 3), false],
    [rational(2, 2), rational(3, 3), false],
    [rational(2, -2), rational(-3, 3), false],
    [rational(1, 2), rational(1, 2), false],
    [rational(1, 2), rational(1, 3), false],
    [rational(1, 3), rational(1, 2), true],
    [rational(2, 3), rational(1, 3), false],
    [rational(1, 3), rational(2, 3), true],
    [rational(1, -3), rational(2, 3), true],
    [rational(-1, 3), rational(2, 3), true],
    [rational(1, 3), rational(-2, 3), false],
    [rational(1, 3), rational(2, -3), false],
    [rational(1, 3), rational(-2, -3), true],
    [rational(-1, 3), rational(2, -3), false],
  ];

  for (let i = 0; i < tests.length; i++) {
    it(`lt (<) test #${i}`, () => {
      const [a, b, expected] = tests[i];
      if (a.lt(b) !== expected) {
        throw new Error(
          `${a.toString()}.lt(${b.toString()}) !== ${expected.toString()}`,
        );
      }
    });
  }
});

describe("toNumber", () => {
  it("returns the closest floating point number", () => {
    expect(rational(1, 2).toNumber()).toEqual(0.5);
    expect(rational(1, 3).toNumber()).toEqual(1 / 3);
  });

  it("returns integers when denominator is 1", () => {
    expect(
      fromInt(42)
        .toNumber()
        .toString(),
    ).toEqual("42");
  });
});

describe("format", () => {
  it("returns a string that rounds to the last 2 digits", () => {
    expect(typeof rational(1, 3).format()).toEqual("string");
    expect(rational(1, 3).format()).toEqual("0.33");
    expect(rational(2, 3).format()).toEqual("0.67");
  });

  it("shows trailing zeros to always include two digits after the dot", () => {
    expect(rational(1, 2).format()).toEqual("0.50");
    expect(fromInt(42).format()).toEqual("42.00");
    expect(fromInt(123).format()).toEqual("123.00");
    expect(rational(1, 100).format()).toEqual("0.01");
  });
});

describe("plus", () => {
  it("adds integers", () => {
    (expect(fromInt(42).plus(fromInt(5))): any).toEqualRational(fromInt(47));
  });

  it("adds rationals", () => {
    (expect(rational(1, 3).plus(rational(1, 3))): any).toEqualRational(
      rational(2, 3),
    );
  });

  it("reduces results", () => {
    (expect(rational(1, 3).plus(rational(1, 6))): any).toEqualRational(
      rational(1, 2),
    );
    (expect(rational(1, 2).plus(rational(1, 2))): any).toEqualRational(
      fromInt(1),
    );
  });
});

describe("minus", () => {
  it("subtracts integers", () => {
    (expect(fromInt(42).minus(fromInt(5))): any).toEqualRational(fromInt(37));
  });

  it("subtracts rationals", () => {
    (expect(rational(2, 3).minus(rational(1, 3))): any).toEqualRational(
      rational(1, 3),
    );
    (expect(rational(1, 2).minus(rational(1, 3))): any).toEqualRational(
      rational(1, 6),
    );
  });

  it("reduces results", () => {
    (expect(rational(1, 2).minus(rational(1, 6))): any).toEqualRational(
      rational(1, 3),
    );
  });

  it("can return 0", () => {
    (expect(rational(1, 2).minus(rational(1, 2))): any).toEqualRational(
      fromInt(0),
    );
  });
});

describe("times", () => {
  it("multiplies integers", () => {
    (expect(fromInt(42).times(fromInt(2))): any).toEqualRational(fromInt(84));
  });

  it("multiplies rationals", () => {
    (expect(rational(2, 3).times(rational(5, 7))): any).toEqualRational(
      rational(10, 21),
    );
    (expect(rational(1, 2).times(rational(1, 3))): any).toEqualRational(
      rational(1, 6),
    );
  });

  it("reduces results", () => {
    (expect(rational(2, 3).times(rational(3, 2))): any).toEqualRational(
      fromInt(1),
    );
  });

  it("can return 0", () => {
    (expect(rational(0, 2).times(rational(23, 42))): any).toEqualRational(
      fromInt(0),
    );
  });
});
