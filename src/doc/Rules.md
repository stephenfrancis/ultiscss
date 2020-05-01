## Rules

1. ALL the CSS styling must be defined in **Components**
   1. i.e. no "special" classes floating about outside components [*1](#footnote-1)
   2. PROPOSED: HTML-style is NOT allowed (i.e. style attribute in an HTML element)
   3. every CSS Rule belongs to one specific Component
2. EVERY **CSS Class** MUST:
   1. Belong to one specific Component
   2. Be identified as **Mandatory** (given as-is in the Signature) or **Optional** (suffixed with a `?` in the Signature)
   3. Be either (a) a Component Class, which:
      1. Has the same name as the Component Id
      2. Occurs only once in the Component Signature - on the top-level element (see below)
      3. Is used ONLY in the .scss of the Component
   4. Or (b) a Switch Class, which:
      1. Indicates some particular state that the markup needs to communicate to the Component
      2. Is named `h-xxx` where 'xxx' is quite short
      3. Is Optional
   5. Or (c) a Third-Party Class, which:
      1. Is one of our agreed list of Third-Party Classes (i.e. FontAwesome, Bootstrap dropdown, collapse, etc)
      2. PROPOSED: Is NOT used in the .scss of the Component
3. EVERY **CSS Selector** MUST:
   1. Reference ONLY Elements defined within the Component
   2. Use classes, pseudo-classes but NOT ids
4. EVERY **Component** MUST:
   1. Have a **Name** which is identical to its top-level CSS Class
   2. Have a **Namespace** for organizational purposes, e.g. `base`, `home`, `lpp`, etc
   3. Have a **Function**, which determines its job, i.e.:
      1. **Widget** (font appearance, colours, cursor, hover, etc) - prefix `w`, OR
      2. **Layout** (positioning and sizing rectangles within rectangles) - prefix `l`
   4. Have a `.scss` file and a `.ejs` file (which determines its Signature)
   5. Have a **Signature** - the "correct" mark-up that the SCSS styles against, defined in an .ejs file.
   6. Have a Signature that is no more than **3 elements deep**
5. EVERY `.ejs` and `.scss` code file MUST:
   1. Be named according to the Component name, and in a folder named Namespace
   2. Be indented by 2 spaces, NOT tabs
6. Don't invent a component until it is needed
7. Do invent a component when it is needed


<a name="footnote-1"></a>**Footnote 1**: There USED TO BE exceptions, e.g.: `l-product-main` includes rules involving ancestor classes `h-layout-mode-grid` and `h-layout-mode-list` to determine whether to appear as Grid-view or List-view tiles. This approach was thought to be desirable, but is now deprecated. The preferred solution now would be for the markup to supply the Switch Class (i.e. the layout mode) to the top-level of the Component, i.e. that `l-product-main` accepts `h-layout-mode-grid` and `h-layout-mode-list`, and that these are repeated in each product tile in the markup. It really isn't that many extra characters...



## Typography

1. Basic Typography styling is defined in the `base` namespace
2. Margin is provided by the native HTML typography elements: `h1`, `h2`, `p`, etc
3. Font size and weight is determined by our base Components, `w-base-h1`, `w-base-body-text`, etc
4. The base Font settings are defined in class `core.scss` which should always and only be applied to `body`


## Widgets

1. Widget Components are named `w-{namespace}-{additional-names}`
2. The outer element can be a div or span, any display setting
3. It should have NO outer margin - i.e. no whitespace around its edge
4. It should contain NO Layout Responsiveness (i.e. determining visibility according to screen width) -
      they can include Scale Responsiveness (i.e. size and weight according to screen width)
5. All the elements are "normative"
6. All elements can have Cardinality defined - the default is `1-1`


## Layout

1. Layout Components are named `l-{namespace}-{additional-names}`
2. All "normative" elements should be divs
3. All "non-normative" elements should be spans or other non-block elements
4. All outer "non-normative" elements should have class "filler" and should contain descriptive
   text or image
5. Responsiveness should be managed by the parent not the child
    1. i.e. no Component should be entirely invisible at any screen-width
6. All "normative" divs can have Cardinality defined - the default is `1-1`
7. "Conformant Mark-up" ALWAYS provides the complete structure of divs expected
    1. Hence the lower-level divs within Layout Components can legitimately be styled by
        their position
