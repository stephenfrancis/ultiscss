
# CSS Declarations

Ultiscss build currently validates UI Components against a looser condition:
* Widgets can contain ANY declarations
* Layouts can contain any declarations EXCEPT: color, font-family, font-size, font-weight, text-decoration


The following is a proposal:

* Allowed CSS Declarations in Widget Components:
  * background-*
  * border
  * color
  * cursor
  * font-*
  * padding
  * text-*
  * white-space

* Allowed CSS Declarations in Layout Components:
  * border, border-radius (EXCEPT on bottom-level elements)
  * display (esp flex)
  * height, width, min-/max- height/width
  * margin
  * order
  * padding (ONLY if margin won't work, and NOT on bottom-level elements)
  * z-index
