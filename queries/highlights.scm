; ==========================================================================
; BidhuScript highlights.scm
;
; Capture names follow the standard tree-sitter highlighting conventions
; (nvim-treesitter / Helix / Zed) so themes work without customization.
;
; ORDERING MATTERS: when two patterns match the very same node, the
; convention used by every consumer of these queries is "last pattern in
; the file wins". So generic/fallback rules go near the TOP, and anything
; meant to override them goes further DOWN.
; ==========================================================================

; ---------------------------------------------------------------------------
; Keywords (distinct anonymous tokens, no overlap with anything else)
; ---------------------------------------------------------------------------

[
  "let"
  "forge"
  "blueprint"
  "spawn"
] @keyword

[
  "if"
  "else"
] @keyword.control.conditional

"while" @keyword.control.repeat

"return" @keyword.control.return

[
  (skip_statement)
  (snap_statement)
] @keyword.control

; ---------------------------------------------------------------------------
; Literals (distinct node types, no overlap)
; ---------------------------------------------------------------------------

(int_literal) @number
(float_literal) @number.float

(true) @boolean
(false) @boolean

(interpreted_string_literal) @string
(interpreted_string_literal_content) @string
(escape_sequence) @string.escape

(char_literal) @character

; ---------------------------------------------------------------------------
; Operators / punctuation (distinct tokens, no overlap)
; ---------------------------------------------------------------------------

[
  "+"
  "-"
  "*"
  "/"
  "%"
  "="
  "=="
  "!="
  "<"
  "<="
  ">"
  ">="
  "^"
  "&"
  "&^"
  "|"
  "<<"
  ">>"
] @operator

[
  "and"
  "or"
  "not"
] @keyword.operator

"~>" @punctuation.special

[
  "("
  ")"
  "{"
  "}"
  "["
  "]"
] @punctuation.bracket

[
  ","
  "."
] @punctuation.delimiter

"\"" @punctuation.special
"'" @punctuation.special

; ---------------------------------------------------------------------------
; Types
; ---------------------------------------------------------------------------

(simple_type) @type.builtin
(custom_type) @type

; ---------------------------------------------------------------------------
; Identifiers: broad fallback FIRST, specific field-based overrides AFTER.
; ---------------------------------------------------------------------------

; fallback: any identifier not overridden by a rule below
(identifier) @variable

(parameter_list
  (identifier) @variable.parameter)

(let_declaration
  name: (identifier) @variable)

(attribure_declaraton
  name: (identifier) @variable.member)

(indexed_identifier
  (identifier) @variable)

(assignment_statement
  (identifier) @variable)

(blueprint_attribute
  object: (identifier) @variable
  attribute: (identifier) @variable.member)

(call_expression
  name: (identifier) @function.call)

(forge_definition
  name: (identifier) @function)

(method_definiton
  name: (identifier) @function.method)

(blueprint_method
  method_call: (call_expression
    name: (identifier) @function.method.call))

; the blueprint's own name at its definition site is a type name, not a
; plain variable
(blueprint_definition
  name: (identifier) @type)

; `spawn Name` / `spawn Name(...)` — both forms name a constructor call
(spwan_expression
  target: (identifier) @constructor)

(spwan_expression
  target: (call_expression
    name: (identifier) @constructor))

; the implicit self-reference used inside forge bodies within a blueprint —
; not a keyword in the grammar, just a naming convention, so match by text.
; This must stay LAST: it needs to win over every other identifier rule
; above whenever the text happens to be "my".
((identifier) @variable.builtin
  (#eq? @variable.builtin "my"))
