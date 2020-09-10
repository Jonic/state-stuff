class SauceComponent {
  constructor(element) {
    this.element = element;
  }

  get data() {
    return this.element.dataset;
  }

  setState(value) {
    this.data.sauceState = value;
  }

  unsetState() {
    delete this.data.sauceState;
  }
}

class SauceStateController {
  constructor(controller) {
    this.components = [];
    this.controller = controller;
    this.initialized = false;
    this.states = [];

    this.initComponents();
    this.initStates();
    this.setInitialState();
  }

  get componentElements() {
    if (this.controller.tagName === "STATE-CONTROLLER") {
      return Array.from(
        this.controller.parentNode.querySelectorAll(
          `:scope > .${this.controller.getAttribute("for")}`
        )
      );
    }

    return [this.controller];
  }

  get stateElements() {
    return Array.from(this.controller.querySelectorAll(":scope > state"));
  }

  initComponents() {
    this.components = this.componentElements.map(
      (element) => new SauceComponent(element)
    );
  }

  initStates() {
    this.states = this.stateElements.map(
      (element, index) => new SauceState({ controller: this, element, index })
    );
  }

  cascadeState(fromIndex) {
    if (!this.initialized) return;

    this.unsetState();
    this.invokeCallbackForState(fromIndex - 1);
  }

  invokeCallbackForState(index) {
    if (index < 0) return;

    this.states[index].forceApply();
  }

  setInitialState() {
    const states = Array.from(this.states);

    states.reverse().forEach((state) => {
      if (this.initialized) {
        return;
      }

      this.initialized = true;
      state.forceApply();
    });
  }

  setState(value) {
    if (!this.initialized) return;

    this.components.forEach((component) => component.setState(value));
  }

  unsetState() {
    this.components.forEach((component) => component.unsetState());
  }
}

class SauceState {
  constructor({ controller, element, index }) {
    this.controller = controller;
    this.element = element;
    this.index = index;
    this.query = null;

    this.attach();
    this.apply();
  }

  get media() {
    return this.element.getAttribute("media");
  }

  get value() {
    return this.element.getAttribute("value");
  }

  attach() {
    this.query = window.matchMedia(this.media);
    this.query.addListener((event) => this.callback(event, this));
  }

  apply(force = false) {
    const state = this;
    let event = this.query;

    if (force) {
      event = { matches: true };
    }

    this.callback(event, state);
  }

  callback(event, state) {
    if (event.matches) {
      state.controller.setState(state.value);
      return;
    }

    state.controller.cascadeState(state.index);
  }

  forceApply() {
    this.apply(true);
  }
}

const stateControllers = document.querySelectorAll(
  "[data-sauce-stateful-component], state-controller"
);

for (const stateController of stateControllers) {
  new SauceStateController(stateController);
}
