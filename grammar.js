/**
 * @file This is a parser for BidhuScript
 * @author Arnab Santra (https://github.com/Arnab-cloud) <arnabsantra248@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  primary: 7,
  unary: 6,
  multiplicative: 5,
  additive: 4,
  comparative: 3,
  and: 2,
  or: 1,
  composite_literal: -1,
};

const multiplicativeOperators = ["*", "/", "%", "<<", ">>", "&", "&^"];
const additiveOperators = ["+", "-", "|", "^"];
const comparativeOperators = ["==", "!=", "<", "<=", ">", ">="];

const terminator = /;/;

const hexDigit = /[0-9a-fA-F]/;
const octalDigit = /[0-7]/;
const decimalDigit = /[0-9]/;
const binaryDigit = /[01]/;

const hexDigits = seq(hexDigit, repeat(seq(optional("_"), hexDigit)));
const octalDigits = seq(octalDigit, repeat(seq(optional("_"), octalDigit)));
const decimalDigits = seq(
  decimalDigit,
  repeat(seq(optional("_"), decimalDigit)),
);
const binaryDigits = seq(binaryDigit, repeat(seq(optional("_"), binaryDigit)));

const hexLiteral = seq("0", choice("x", "X"), optional("_"), hexDigits);
const octalLiteral = seq(
  "0",
  optional(choice("o", "O")),
  optional("_"),
  octalDigits,
);
const decimalLiteral = choice(
  "0",
  seq(/[1-9]/, optional(seq(optional("_"), decimalDigits))),
);
const binaryLiteral = seq("0", choice("b", "B"), optional("_"), binaryDigits);

const decimalExponent = seq(
  choice("e", "E"),
  optional(choice("+", "-")),
  decimalDigits,
);
const decimalFloatLiteral = choice(
  seq(decimalDigits, ".", optional(decimalDigits), optional(decimalExponent)),
  seq(decimalDigits, decimalExponent),
  seq(".", decimalDigits, optional(decimalExponent)),
);

const hexExponent = seq(
  choice("p", "P"),
  optional(choice("+", "-")),
  decimalDigits,
);
const hexMantissa = choice(
  seq(optional("_"), hexDigits, ".", optional(hexDigits)),
  seq(optional("_"), hexDigits),
  seq(".", hexDigits),
);
const hexFloatLiteral = seq("0", choice("x", "X"), hexMantissa, hexExponent);

const floatLiteral = choice(decimalFloatLiteral, hexFloatLiteral);

const intLiteral = choice(
  binaryLiteral,
  decimalLiteral,
  octalLiteral,
  hexLiteral,
);

export default grammar({
  name: "bidhuscript",

  reserved: {
    global: ($) => [
      "let",
      "spawn",
      "if",
      "else",
      "while",
      "return",
      "forge",
      "and",
      "or",
      "blueprint",
      "not",
    ],
  },

  rules: {
    source_file: ($) =>
      repeat(
        choice(seq($._statement, terminator), $._statement_ending_with_block),
      ),

    _statement_ending_with_semicolon: ($) =>
      choice(
        $._declaration,
        $._simple_statement,
        $.return_statement,
        $.skip_statement,
        $.snap_statement,
      ),

    _statement_ending_with_block: ($) =>
      choice(
        $.if_statement,
        $.while_statement,
        $.forge_definition,
        $.blueprint_definition,
      ),

    _statement: ($) =>
      choice(
        $._statement_ending_with_semicolon,
        $._statement_ending_with_block,
      ),

    _declaration: ($) => choice($.let_declaration),

    _simple_statement: ($) =>
      choice($.expression_statement, $.assignment_statement),

    return_statement: ($) => seq("return", optional($._expression)),

    if_statement: ($) =>
      seq(
        "if",
        "(",
        field("condition", $._expression),
        ")",
        field("consequence", $.code_block),
        optional(seq("else", field("alternative", $.code_block))),
      ),

    while_statement: ($) =>
      seq(
        "while",
        "(",
        field("initializer", optional($.let_declaration)),
        terminator,
        field("condition", $._expression),
        terminator,
        field("update", optional($.assignment_statement)),
        terminator,
        field("dunno_field", $._expression),
        ")",
        field("body", $.code_block),
      ),

    forge_definition: ($) =>
      seq(
        "forge",
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        optional(seq("~>", field("result", $._type))),
        field("body", $.code_block),
      ),

    blueprint_definition: ($) =>
      seq(
        "blueprint",
        field("name", $.identifier),
        "{",
        field("body", $.blueprint_body),
        "}",
      ),

    blueprint_body: ($) =>
      repeat1(
        choice(
          alias($.forge_definition, $.method_definition),
          $.attribute_declaration,
        ),
      ),
    attribute_declaration: ($) =>
      seq(field("type", $._type), field("name", $.identifier), terminator),

    parameter_list: ($) => seq("(", commaSep(seq($._type, $.identifier)), ")"),

    skip_statement: (_) => "skip",
    snap_statement: (_) => "snap",

    code_block: ($) => seq("{", optional($.statement_list), "}"),

    statement_list: ($) =>
      repeat1(
        choice(seq($._statement, terminator), $._statement_ending_with_block),
      ),

    expression_statement: ($) => $._expression,
    assignment_statement: ($) =>
      seq(
        choice($.identifier, $.indexed_identifier, $.blueprint_attribute),
        "=",
        prec.left(0, $._expression),
      ),

    let_declaration: ($) =>
      seq(
        "let",
        field("type", choice($._type, $.array_type_declarator)),
        field("name", $.identifier),
        optional(seq("=", field("value", $._expression))),
      ),

    _type: ($) =>
      choice($.simple_type, alias($.identifier, $.custom_type), $.array_type),
    array_type_declarator: ($) =>
      seq($.simple_type, "[", field("size", $.int_literal), "]"),
    simple_type: ($) => choice("int", "float", "string", "char", "bool"),
    array_type: ($) => seq($.simple_type, "[", "]"),

    expression_list: ($) => seq(repeat($._expression), $._expression),
    _expression: ($) =>
      choice(
        $.identifier,
        $.spwan_expression,
        $.unary_expression,
        $.binary_expression,
        $.call_expression,
        $._string_literal,
        $.float_literal,
        $.int_literal,
        $.bool_literal,
        $.char_literal,
        $.array_literal,
        $.indexed_identifier,
        $._blueprint_member,
      ),

    identifier: (_) => /[_\p{XID_Start}][_\p{XID_Continue}]*/v,
    spwan_expression: ($) =>
      seq("spawn", field("target", choice($.identifier, $.call_expression))),
    unary_expression: ($) =>
      prec(
        PREC.unary,
        seq(
          field("operator", choice("+", "-", "not", "^", "*")),
          field("operand", $._expression),
        ),
      ),
    binary_expression: ($) => {
      const table = [
        [PREC.multiplicative, choice(...multiplicativeOperators)],
        [PREC.additive, choice(...additiveOperators)],
        [PREC.comparative, choice(...comparativeOperators)],
        [PREC.and, "and"],
        [PREC.or, "or"],
      ];

      return choice(
        ...table.map(([precedence, operator]) =>
          prec.left(
            // @ts-ignore
            precedence,
            seq(
              field("left", $._expression),
              // @ts-ignore
              field("operator", operator),
              field("right", $._expression),
            ),
          ),
        ),
      );
    },

    call_expression: ($) =>
      seq(
        field("name", $.identifier),
        "(",
        field("arguments", commaSep($._expression)),
        ")",
      ),

    _string_literal: ($) => choice($.interpreted_string_literal),
    char_literal: ($) =>
      seq(
        "'",
        choice(
          /[^'\\]/, // 1. Any single character EXCEPT a quote or backslash
          $.escape_sequence, // 2. A valid escape sequence
        ),
        "'",
      ),
    float_literal: (_) => token(floatLiteral),
    int_literal: (_) => token(intLiteral),
    bool_literal: ($) => choice($.true, $.false),

    array_literal: ($) =>
      seq(
        "[",
        commaSep(
          choice(
            $._string_literal,
            $.float_literal,
            $.int_literal,
            $.bool_literal,
            $.char_literal,
          ),
        ),
        "]",
      ),
    indexed_identifier: ($) => seq($.identifier, "[", $._expression, "]"),

    _blueprint_member: ($) => choice($.blueprint_attribute, $.blueprint_method),

    blueprint_attribute: ($) =>
      seq(field("object", $.identifier), ".", field("attribute", $.identifier)),

    blueprint_method: ($) =>
      seq(
        field("object", $.identifier),
        ".",
        field("method_call", $.call_expression),
      ),

    true: (_) => "true",
    false: (_) => "false",

    interpreted_string_literal: ($) =>
      seq(
        '"',
        repeat(
          choice(
            alias(
              token.immediate(prec(1, /[^"\n\\]+/)),
              $.interpreted_string_literal_content,
            ),
            $.escape_sequence,
          ),
        ),
        token.immediate('"'),
      ),

    escape_sequence: (_) =>
      token.immediate(
        seq(
          "\\",
          choice(
            /[^xuU]/,
            /\d{2,3}/,
            /x[0-9a-fA-F]{2,}/,
            /u[0-9a-fA-F]{4}/,
            /U[0-9a-fA-F]{8}/,
          ),
        ),
      ),
  },
});

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @returns {SeqRule}
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @returns {ChoiceRule}
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}
