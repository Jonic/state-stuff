# Stateful Components

Note: You can [view a live demo](https://state-stuff.100yen.co.uk) on my website.

This demo outlines a method of differing a component's display state, without necessarily tying it direct to the browser's `min-width` in your CSS. The method was first discussed in [this Github issue](https://github.com/RaspberryPiFoundation/sauce-design-system/issues/36).

The objective is to allow components to display in pre-defined states, but to be able to control those which of those states applies in our layout.

Here's what a stateful component looks like:

```html
<div class="component-test" data-sauce-stateful-component>
  <state media="(min-width: 500px)" value="red"></state>
  <state media="(min-width: 700px)" value="blue"></state>
  <state media="(min-width: 900px)" value="green"></state>
  <state media="(min-width: 1100px)" value="green rounded"></state>
  Hello, World
</div>
```

In this example, the `.component-test` element should...

1. have a grey border when min-width < 500px
2. have a red border when min-width >= 500px
3. have a blue border when min-width >= 700px
4. have a green border when min-width >= 900px
5. have a green, rounded border when min-width >= 1100px

## How it works

I've written a _tiny_ JavaScript utility (< 2kB minified) which will search for any element with a data attribute of `data-sauce-stateful-component`. It will then look within that element to find any `state` elements. Each `state` represents a pre-defined set of styles in the component's CSS.

**Note that the `state` element isn't a _real_ HTML element, and is a semi-custom element inspired by the `source` element found inside `audio`, `picture`, and `video` elements.**

Each `state` has a `media` and `value` attributes. We use the JavaScript `window.matchMedia` API to listen for the `media` query event, and when it matches we take the `value` and set it as the value of the `data-sauce-state` attribute on the component.

We can now look for this data attribute in our styles, and apply the appropriate CSS state:

```css
.component-test[data-sauce-state*="red"] {
  --border-color: red;
}
```

If a `matchMedia` event is triggered, and the query no longer matches, the state machine will "cascade" to the state that preceeded it. In our example above:

```html
<state media="(min-width: 700px)" value="blue"></state>
<state media="(min-width: 900px)" value="green"></state>
```

When `(min-width: 900px)` no longer applies, the `data-sauce-state` will be cascade to the `blue` state, because it's the state that was specified before.

## Use on multiple components

If your page contains several instances of a component, and they all need to share the same state rules, you can set up a `state-controller` to target them:

```html
<state-controller for="component-test">
  <state media="(min-width: 500px)" value="horizontal"></state>
  <state media="(min-width: 900px)" value="vertical"></state>
</state-controller>

<div class="component-test">...</div>
<div class="component-test">...</div>
<div class="component-test">...</div>
```

In this example, our `state-controller` will apply its `state` rules to any adjacent element with a selector matching its `for` attribute. Other than the elements it targets, it's functionally identical to the first example.

Applying state to multiple components using a controller greatly reduces the number of `matchMedia` event listeners in use at once. In this example we have two, if we were to apply the same state rules on the components individually we'd have six. Add more components and states and you can see how things would become a burden on the browser.

## Where do the states come from?

States will be defined in Sauce components. Any component states will be documented, with examples of each.

**When you include a component from Sauce, you only get the component.** Deciding how your layout should apply these states is a decision to be made at the application-level. It's possible we'll end up with a `stateful-layout` concept that will expect designed for use with a specific collection of components, but for now we're making no decisions up front.

The advantage being that we allow engineers to control the state behavior of components in specific contexts, rather than the components having all that decision making built in at a level far-removed from its implementation. A component in Sauce has no idea where it will be used, nor should it. All a component should do is what the component design dictates, and nothing more.

## What other benefits are there?

We won't have to spend time designing "in between" states in Figma. Build the small one, and apply state to the layouts as you work your way up to our maximum container width.

This will help us build more rapidly. When paired with a set of robust layouts we should be able to assemble any collection of components in any order, and handle their display on any device.

Designers design less, engineers spend less time overriding styles (and then overriding their overrides), and we get to deliver solid designs on any screen size.

We can also author our styles in a much more structured fashion, allowing us to very easily document each state. We can also use Chromatic to ensure our states are stable, and even test to see what happens when we combine various states. This will lead to solid components that we can deploy with confidence.

This is also a deliberate attempt by me to stop us thinking that we can solve any layout issue with a `min-width` media query. Responsive design is so much more than the width of a browser window, and although `min-width` was used in the examples above, we can use [any valid media query](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries) to control our states (I used in the examples `min-width` to reduce the cognitive leap required to get on board with this idea).

## But we're trying to use less JavaScript!

"Less JavaScript" is not "no JavaScript". Progressive enhancement is a good thing, and this is precisely what JavaScript was designed for. The script is deliberately tiny, has no external dependencies, and could easily be include inline in our application layouts.

Each element that requires a new state receives a single DOM manipulation to edit an attribute, so it executes ridiculously quickly.

The browser does then have to repaint all the elements that have changed state, but it would have to do that if we matched a media query in the CSS anyway.

## Can I use the CSS states without using this script?

Absolutely. If you want a horizontal card, and for it to _always_ be horizontal, you can manually specify the state attribute:

```html
<div class="card" data-sauce-state="horizontal">... card contents ...</div>
```

We can also use this as a fallback for browsers that we don't support. SPEAKING OF WHICH:

## What's the browser support?

Basically not IE11. This is progressive enhancement, and at some point you have to draw a line about "support". However, given that the component styles are still controlled with plain CSS, the baseline experience offered to non-compatible browsers will be whatever default state we've set in the styles, or manually set in the markup.

We need to clarify what we mean about "browser support", which will be tackled over in the Design System.

## This is scary

I know. I'm scared, too. It's okay, we'll get through this together.

The fact of the matter is, sometimes web development is scary, and you have to try new things. I'm confident that this system will work well for us, and I'm finding it hard to find drawbacks right now.

There are of course a few things to consider and improve (see below), but the _technique_ seems to have legs. If we choose to adopt then we can plan out these improvements accordingly.

## TODO:

### ADR

Are we doing this? Why/why not?

### MVP

What is it? Where does all this live? How will it be documented?

### Page Load

How can we only apply the one state we need on page load? Currently it looks through each state and applies it if the media-query is a match. In our example above, if your browser window is over 1100px wide on load, this happens:

1. Render default state (as if no JavaScript)
2. `SauceComponent` kicks in.
3. First state is applied, because min-width > 500px
4. First state is removed, second state is applied, because min-width > 700px
5. Second state is removed, third state is applied, because min-width > 900px
6. Third state is removed, fourth state is applied, because min-width > 1100px

What _should_ happen is this:

1. Render default state (as if no JavaScript)
2. `SauceComponent` kicks in.
3. Fourth state is applied, because min-width > 1100px

### DOM Updates

We’ll need to ensure that components are correctly handled when added to the DOM.

We should also figure out what happens when a `SauceStateMachine` is applied to a component and some other piece of JavaScript attempts to explicitly override the `data-sauce-state` value.

### Pure JavaScript interface?

Should it also be possible to configure components purely in JavaScript? Should this be **the** way to configure state on components, removing it from the markup altogether? What are the pros and cons for each approach?

### Multiple query types

Currently the “fallback” behavior only works if all of your media queries are checking for the same value. For example, the `min-width` checks in our example.

Consider that a component may require some state changes for min-width, but also includes state options for example:

```html
<state media="(prefers-color-scheme: dark)" value="dark-mode"></state>
<state media="(min-width: 500px)" value="red"></state>
<state media="(min-width: 700px)" value="blue"></state>
```

In this scenario, the `dark-mode` state will be removed once the next media-query is satisfied: `min-width: 500px`. We would need a way to avoid this.

Similarly, if the browser width dips below 500px, the next state checked will be the `prefers-color-scheme` media query, which doesn’t bear any real relation to the state the preceeded it.

The difficulty here is that our current ways of delivering responsive designs is stacking ever-wider media queries atop one another, when in fact actual responsive design can encompass many other aspects of the user’s browser context. Our new tools should aim to move away from solely `min-width` ways of thinking.

### Accessibility

We must ensure that the `state` elements don’t intefere with assisstive technologies.

It’s also important that components are built with assisstive technologies in mind. The markup should be written with the component's content in mind, not any particular state that the component will be displayed in.

### How do our apps consume this?

#### Vanilla

Inline a script in your HTML. It'll automatically set itself up on any components that need it.

#### Rails

We can use Github's [ViewComponent](https://github.com/github/view_component) Gem and create a `SauceComponent` class, which all our other components extend. This SauceComponent will be able to take a state configuration object.

#### React

React will require a [Higher Order Component](https://reactjs.org/docs/higher-order-components.html) to wrap our state stuff. Little bit to think about there, because React itself is supposed to handle DOM updates, so we'll need to test that.

#### Other

The script's in the repo, so I'm sure you can make it work :)
