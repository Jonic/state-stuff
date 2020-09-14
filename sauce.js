class SauceComponent {
  constructor(element) {
    this.element = element
  }

  get data() {
    return this.element.dataset
  }

  setState(value) {
    this.data.sauceState = value
  }

  unsetState() {
    delete this.data.sauceState
  }
}

class SauceStateController {
  constructor(controller) {
    this.components = []
    this.controller = controller
    this.initialized = false
    this.states = []

    this.initComponents()
    this.initStates()
    this.setInitialState()
  }

  get componentElements() {
    if (this.controller.tagName === 'STATE-CONTROLLER') {
      return Array.from(
        this.controller.parentNode.querySelectorAll(
          `:scope > .${this.controller.getAttribute('for')}`
        )
      )
    }

    return [this.controller]
  }

  get stateElements() {
    return Array.from(this.controller.querySelectorAll(':scope > state'))
  }

  initComponents() {
    this.components = this.componentElements.map(
      (element) => new SauceComponent(element)
    )
  }

  initStates() {
    this.states = this.stateElements.map(
      (element, index) => new SauceState({ controller: this, element, index })
    )
  }

  cascadeState(fromIndex) {
    if (!this.initialized) return

    this.unsetState()
    this.invokeCallbackForState(fromIndex - 1)
  }

  invokeCallbackForState(index) {
    if (index < 0) return

    this.states[index].cascadeState()
  }

  setInitialState() {
    const states = Array.from(this.states)

    states.reverse().forEach((state) => {
      if (this.initialized) return

      this.initialized = true
      state.cascadeState()
    })
  }

  setState(value) {
    if (!this.initialized) return

    this.components.forEach((component) => component.setState(value))
  }

  unsetState() {
    this.components.forEach((component) => component.unsetState())
  }
}

class SauceState {
  constructor({ controller, element, index }) {
    this.controller = controller
    this.element = element
    this.index = index
    this.query = null

    this.addEvent()
  }

  get media() {
    return this.element.getAttribute('media')
  }

  get value() {
    return this.element.getAttribute('value')
  }

  addEvent() {
    this.query = window.matchMedia(this.media)
    this.query.addEventListener('change', (event) =>
      this.applyState(event, this)
    )

    this.cascadeEvent = new Event('change', {
      target: this.query,
    })
  }

  applyState(event = this.query) {
    if (event.target.matches) {
      this.controller.setState(this.value)
      return
    }

    this.controller.cascadeState(this.index)
  }

  cascadeState() {
    this.query.dispatchEvent(this.cascadeEvent)
  }
}

document
  .querySelectorAll('[data-sauce-stateful-component], state-controller')
  .forEach((controller) => new SauceStateController(controller))
