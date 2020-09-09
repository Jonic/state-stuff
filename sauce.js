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
    this.initialized = false;

    this.components;
    this.controller = controller;
    this.states;

    this.initComponents();
    this.initStates();

    this.initialized = true;
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

    this.states[index].applyCascade();
  }

  setState(value) {
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
    this.query;

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

  apply() {
    this.callback(this.query, this);
  }

  applyCascade() {
    this.callback({ matches: true }, this);
  }

  callback(event, state) {
    if (event.matches) {
      state.controller.setState(state.value);
      return;
    }

    state.controller.cascadeState(state.index);
  }
}

const stateControllers = document.querySelectorAll(
  "[data-sauce-stateful-component], state-controller"
);

for (const stateController of stateControllers) {
  new SauceStateController(stateController);
}
