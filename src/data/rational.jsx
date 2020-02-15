// @flow

export const rational: (number, number) => Rational = (
  numerator,
  denominator,
) => {
  if (denominator == 0) {
    throw "division by zero";
  }
  if (numerator === 0) {
    return new _Rational(0, 1);
  }
  const gcd = getGcd(Math.abs(numerator), Math.abs(denominator));
  return new _Rational(
    (numerator * Math.sign(denominator)) / gcd,
    Math.abs(denominator) / gcd,
  );
};

const getGcd: (number, number) => number = (a, b) => {
  let r;
  while (b != 0) {
    r = a % b;
    a = b;
    b = r;
  }
  return a;
};

export const fromInt: number => Rational = n => rational(n, 1);

export type Rational = _Rational;

class _Rational {
  numerator: number;
  denominator: number;

  constructor(numerator: number, denominator: number) {
    this.numerator = numerator;
    this.denominator = denominator;
  }

  toNumber: () => number = () => this.numerator / this.denominator;

  format: () => string = () => {
    const rounded = Math.round(this.toNumber() * 100);
    const integer = Math.floor(rounded / 100).toString();
    let fraction = (rounded % 100).toString();
    if (fraction.length === 1) fraction = "0" + fraction;
    return integer + "." + fraction;
  };

  toString: () => string = () => {
    return `(${this.numerator}) % (${this.denominator})`;
  };

  equals: Rational => boolean = other => {
    return (
      this.numerator === other.numerator &&
      this.denominator === other.denominator
    );
  };

  ge: Rational => boolean = other => {
    return (
      this.numerator * other.denominator >= other.numerator * this.denominator
    );
  };

  gt: Rational => boolean = other => {
    return (
      this.numerator * other.denominator > other.numerator * this.denominator
    );
  };

  le: Rational => boolean = other => {
    return (
      this.numerator * other.denominator <= other.numerator * this.denominator
    );
  };

  lt: Rational => boolean = other => {
    return (
      this.numerator * other.denominator < other.numerator * this.denominator
    );
  };

  plus: Rational => Rational = other => {
    return rational(
      this.numerator * other.denominator + other.numerator * this.denominator,
      this.denominator * other.denominator,
    );
  };

  minus: Rational => Rational = other => {
    return rational(
      this.numerator * other.denominator - other.numerator * this.denominator,
      this.denominator * other.denominator,
    );
  };

  times: Rational => Rational = other => {
    return rational(
      this.numerator * other.numerator,
      this.denominator * other.denominator,
    );
  };

  over: Rational => Rational = other => {
    return rational(
      this.numerator * other.denominator,
      this.denominator * other.numerator,
    );
  };
}
