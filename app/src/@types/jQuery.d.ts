interface JQuery {
  bootstrapToggle(options?: BootstrapToggleOptions): JQuery;
  bootstrapToggle(action: string, silentPropagation?: boolean): JQuery;
}

interface BootstrapToggleOptions {
  on?: string;
  off?: string;
  onstyle?: string;
  offstyle?: string;
  size?: string;
  style?: string;
  width?: number;
  height?: number;
}
