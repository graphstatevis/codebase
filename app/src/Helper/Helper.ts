import Point from '../Entities/Point';

export class Helper {

  static get RandomColor(): string {
    let color = '';
    for (let i = 0; i < 3; i++) {
      const sub = Math.floor(Math.random() * 256).toString(16);
      color += (sub.length === 1 ? '0' + sub : sub);
    }

    return `#${color}`;
  }

  static get TransitionTime(): number {
    return 500;
  }

  public static getScale(transform: string): number {
    if (!transform) return 1;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttributeNS(null, 'transform', transform);
    const matrix = g.transform.baseVal.consolidate().matrix;

    // As per definition values e and f are the ones for the translation.
    return matrix.d;
  }

  public static getTransform(x: number, y: number): string {
    return `translate(${x},${y})`;
  }

  public static getTranslation(transform: string): [number, number] {
    if (!transform) return [NaN, NaN];

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttributeNS(null, 'transform', transform);
    const matrix = g.transform.baseVal.consolidate().matrix;

    // As per definition values e and f are the ones for the translation.
    return [matrix.e, matrix.f];
  }

  public static toEntries<T>(a: T[]) {
    return a.map((value, index) => [index, value] as const);
  }

  public static array2Point(array: [number, number]): Point {
    return new Point(array[0], array[1]);
  }

  public static getUrlSearchParameters(): any {
    const pairs = window.location.search.substring(1).split('&');
    const obj = {};
    let pair;
    let i;

    for ( i in pairs ) {
      if ( pairs[i] === '' ) continue;

      pair = pairs[i].split('=');
      obj[ decodeURIComponent( pair[0] ) ] = decodeURIComponent( pair[1] );
    }

    return obj;
  }

  /**
   * Deep copy function for TypeScript.
   * @param T Generic type of target/copied value.
   * @param target Target value to be copied.
   * @see Source project, ts-deepcopy https://github.com/ykdr2017/ts-deepcopy
   * @see Code pen https://codepen.io/erikvullings/pen/ejyBYg
   */
   public static deepCopy = <T>(target: T): T => {
    if (target === null) {
      return target;
    }
    if (target instanceof Date) {
      return new Date(target.getTime()) as any;
    }
    if (target instanceof Array) {
      const cp = [] as any[];
      (target as any[]).forEach(v => { cp.push(v); });

      return cp.map((n: any) => Helper.deepCopy<any>(n)) as any;
    }
    if (typeof target === 'object' && target !== {}) {
      const cp = { ...(target as { [key: string]: any }) } as { [key: string]: any };
      Object.keys(cp).forEach(k => {
        cp[k] = Helper.deepCopy<any>(cp[k]);
      });

      return cp as T;
    }

    return target;
  };  
}
