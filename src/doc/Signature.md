
# Signature

* Every Component has a specific markup structure that it is designed against - the "Normative
  Markup"
* Normative Markup is a structure of elements and classes
* When the Component is actually used, the markup it is applied to is called the Actual Markup.
* Actual Markup is either Conformant (i.e. matches the Normative Markup) or else Non-Conformant.
* Conformant means that the structure of the Actual Markup's elements and classes matches the
  Normative Markup.
* Actual Markup can (and usually will) include text and other attributes - these don't affect
  the matching.
* The "Signature" is a concise expression of the Normative Markup, and is generated from the
  Component's `.ejs` file, with non-class attributes and text stripped out, but includes
  Cardinality where specified.
* In addition to the above, the Normative Markup of Layout Components only includes **divs**,
  not other elements.
* The "leaf nodes" (divs that don't contain other divs) are allowed to (indeed expected to) contain
  other elements and are called "receptacles".
* The non-leaf-nodes (divs that contain other divs) must ONLY contain divs.

```
    <div class="l-namespace-example">
        <div></div>
        <div>
            <div></div>
            <div>
                <div></div>
            </div>
            <div></div>
        </div>
    </div>
```
