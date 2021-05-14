export default interface Settings {
  enableControls(): void;
  render(): void;
  setContainer(container: JQuery<HTMLElement>): void;
}
