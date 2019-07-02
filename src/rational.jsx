// @flow

export const rational: (number, number) => Rational = (
  numerator,
  denominator,
) => {
  return new _Rational(numerator, denominator).normalize();
};

export const fromInt: number => Rational = n => rational(n, 1);

const getGcd: (number, number) => number = (a, b) => {
  while (a !== b) {
    if (a > b) {
      a -= b;
    } else if (b > a) {
      b -= a;
    }
  }
  return a;
};

export type Rational = _Rational;

class _Rational {
  numerator: number;
  denominator: number;

  constructor(numerator: number, denominator: number) {
    this.numerator = numerator;
    this.denominator = denominator;
  }

  toNumber: () => number = () => this.numerator / this.denominator;

  format = () => {
    const integer = Math.floor(this.toNumber()).toString();
    let fraction = Math.round((this.toNumber() * 100) % 100).toString();
    if (fraction.length === 1) fraction = "0" + fraction;
    return integer + "." + fraction;
  };

  toString: () => string = () => {
    return `(${this.numerator}) % (${this.denominator})`;
  };

  normalize: () => Rational = () => {
    if (this.numerator === 0) {
      return new _Rational(0, 1);
    }
    const gcd = getGcd(Math.abs(this.numerator), Math.abs(this.denominator));
    return new _Rational(
      (this.numerator * Math.sign(this.denominator)) / gcd,
      Math.abs(this.denominator) / gcd,
    );
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
}
