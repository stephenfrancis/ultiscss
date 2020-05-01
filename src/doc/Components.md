
# Components

Ultiscss works on source files with filenames following a specific pattern:

{source_folder}/{namespace}/{x}-{namespace}-{specific-name}.{extension}

where:
* {source_folder} is main source folder of the project, e.g. brazil/src
* {namespace} is the name of a functional sub-unit of the project
* {x} identifies the object type, and is one of: **a**, **l**, **s**, or **w**, see below.
* {specific name} is the rest of the object's name, making it unique
* {extension} is usually either **.ejs**, **.scss** or **.js**

## UI Components (**l-** or **w-**)

The main building blocks of the UI, these are SCSS style blocks that relate to specific markup
structures. Each component MUST have two files with the same name, one with a `.ejs` extension,
the other with `.scss`. The build process creates corresponding `.css`, `.html` and `.txt` files
in {build_folder}/{namespace}.
