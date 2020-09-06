class SaucePage {
  constructor(body) {
    this.body = body;
    this.components = [];

    this.initComponents();
  }

  initComponents() {
    const elements = this.body.querySelectorAll("[data-sauce-component]");

    for (const element of elements) {
      const component = new SauceComponent(element);
      this.components.push(component);
    }
  }
}

class SauceComponent {
  constructor(element) {
    this.element = element;
    this.stateMachine = new SauceStateMachine(this);
  }

  get data() {
    return this.element.dataset;
  }
}

class SauceStateMachine {
  constructor(component) {
    this.component = component;
    this.states = [];

    this.initStates();
    this.initialized = true;
  }

  cascadeState(fromIndex) {
    if (!this.initialized) return;

    const newIndex = (fromIndex -= 1);

    this.unsetStateValue();

    if (newIndex >= 0) {
      this.invokeCallbackForState(newIndex);
    }
  }

  initStates() {
    const stateElements = this.component.element.querySelectorAll("state");

    for (let index = 0; index < stateElements.length; index += 1) {
      this.states.push(new SauceState(this, index, stateElements[index]));
    }
  }

  invokeCallbackForState(index) {
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
    this.index = index;
    this.element = element;
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
    if (!event.matches) {
      state.component.cascadeState(state.index);
      return;
    }

    state.component.setStateValue(state.value);
  }
}

new SaucePage(document.querySelector("[data-sauce-page]"));
