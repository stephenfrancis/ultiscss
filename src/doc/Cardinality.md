
# Cardinality

Each element in the Signature can have a Cardinality supplied, via the attribute
`data-cardinality`, which specifies a range of times this element can appear. The Cardinality can
be:
  * A single number, in which case the lower and upper bounds are the same - that number - the
  element must occur exactly that many times.
  * Two numbers, separated by a dash - being the lower and upper bounds
  * A number, then a dash then an asterisk - being the lower bound, with no upper bound - there
  can be infinitely many elements.

If no cardinality is given, `1-1` is assumed - one-and-only-one occurrence of the element.
Other common values are: `0-1` (simple optionality), `0-*` (any number), and `1-*` (at least one).

No element of cardinality other than `1-1` can be followed by another element of the same tag name.
