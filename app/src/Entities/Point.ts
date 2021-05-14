class Point {
  constructor(public x: number = 0.0, public y: number = 0.0) {}

  /**
   * Subtract first point from second point parameter!
   */
  public static subtract(p1: Point, p2: Point): Point {
    return new Point(p2.x - p1.x, p2.y - p1.y);
  }

  public static add(p1: Point, p2: Point): Point {
    return new Point(p2.x + p1.x, p2.y + p1.y);
  }

  public equals(p: Point): boolean {
    return p.x === this.x && p.y === this.y;
  }

  public euclDist(p: Point): number {
    return Math.sqrt(Math.pow(p.x - this.x, 2) + Math.pow(p.y - this.y, 2));
  }

  public getMiddle(p: Point): Point {
    if (p) {
      return new Point((p.x + this.x) / 2, (p.y + this.y) / 2);
    }
  }
}

export default Point;
