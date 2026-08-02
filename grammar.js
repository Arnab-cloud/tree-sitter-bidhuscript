/**
 * @file This is a parser for BidhuScript
 * @author Arnab Santra (https://github.com/Arnab-cloud) <arnabsantra248@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

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
    global: ($) => ["let", "spawn"],
  },

  rules: {
    // TODO: add the actual grammar rules
    source_file: ($) => repeat(seq($._statement, terminator)),

    _statement: ($) =>
      choice(
        $._declaration,
        $._simple_statement,
        // $.return_statement,
        // $.if_statement,
        // $.while_statment,
        // $.skip_statement,
        // $.snap_statement,
        // $.empty_statement,
      ),

    _declaration: ($) => choice($.let_declaration),

    _simple_statement: ($) =>
      choice($.expression_statement, $.assignment_statement),

    expression_statement: ($) => $.expression,
    assignment_statement: ($) => seq($.identifier, "=", $.expression),

    let_declaration: ($) =>
      seq(
        "let",
        field("type", $._type),
        field("name", $.identifier),
        optional(seq("=", field("value", $.expression))),
      ),

    _type: ($) => choice($.simple_type),
    simple_type: ($) => choice("int", "float", "string", "char", "bool"),

    expression_list: ($) => seq(repeat($.expression), $.expression),
    expression: ($) =>
      choice(
        $.identifier,
        alias("spawn", $.identifier),
        $._string_literal,
        $.float_literal,
        $.int_literal,
        $.bool_literal,
        // $.char_literal,
      ),

    identifier: (_) => /[_\p{XID_Start}][_\p{XID_Continue}]*/v,
    _string_literal: ($) => choice($.interpreted_string_literal),
    float_literal: (_) => token(floatLiteral),
    int_literal: (_) => token(intLiteral),
    bool_literal: ($) => choice($.true, $.false),

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
