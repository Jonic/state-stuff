class SauceComponent {
  constructor(element) {
    this.element = element;

    if (this.hasState) {
      new SauceStateMachine(this);
    }
  }

  get data() {
    return this.element.dataset;
  }

  get hasState() {
    return this.stateElements.length > 0;
  }

  get stateElements() {
    return this.element.querySelectorAll(":scope > state");
  }
}

class SauceStateMachine {
  constructor(component) {
    this.component = component;
    this.initialized = false;
    this.states = [];

    const stateElements = this.component.stateElements;

    for (let index = 0; index < stateElements.length; index += 1) {
      this.states.push(new SauceState(this, index, stateElements[index]));
    }

    this.initialized = true;
  }

  cascadeState(fromIndex) {
    if (!this.initialized) return;

    this.unsetStateValue();
    this.invokeCallbackForState(fromIndex - 1);
  }

  invokeCallbackForState(index) {
    if (index < 0) return;

    this.states[index].applyCascade();
  }

  setStateValue(value) {
    this.component.data.sauceState = value;
  }

  unsetStateValue() {
    delete this.component.data.sauceState;
  }
}

class SauceState {
  constructor(component, index, element) {
    this.component = component;
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
      state.component.setStateValue(state.value);
      return;
    }

    state.component.cascadeState(state.index);
  }
}

const elements = document.querySelectorAll("[data-sauce-component]");

for (const element of elements) {
  new SauceComponent(element);
}
