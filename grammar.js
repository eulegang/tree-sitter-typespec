module.exports = grammar({
  name: "typespec",

  extras: $ => [
    $.single_line_comment,
    $.multi_line_comment,
    /[\s]/ // TODO: All possible whitespace characters
  ],

  rules: {
    source_file: $ => repeat($._item),

    _item: $ => choice(
      $._comment,
      $._statement,
    ),

    _statement: $ => choice(
      $.namespace_statement,
      $.import_statement,
      $.using_statement,
      $.model_statement,
      $.scalar_statement,
      $.interface_statement,
      $.enum_statement,
      $.alias_statement,
      $.augment_decorator_statement,
      $.operation_statement,
      ";",

      // TODO
      // $.decorator_declaration_statement,
      // $.function_declaration_statement,
    ),

    decorator_list: $ => repeat1($.decorator),

    decorator: $ => seq(
      "@",
      $._identifier_or_member_expression,
      optional($.decorator_arguments)
    ),

    decorator_arguments: $ => seq(
      "(", optional($.expression_list), ")",
    ),

    import_statement: $ => seq(
      "import",
      $._string_literal,
      ";",
    ),

    using_statement: $ => seq(
      "using",
      $._identifier_or_member_expression,
      ";",
    ),

    namespace_statement: $ => seq(
      optional($.decorator_list),
      "namespace",
      $._identifier_or_member_expression,
      choice(
        ";",
        seq("{", repeat($._statement), "}"),
      ),
    ),

    model_statement: $ => seq(
      optional($.decorator_list),
      "model",
      $._identifier,
      optional($.template_parameters),
      choice(
        seq($.model_is_heritage, ";"),
        seq(
          optional($._model_heritage),
          $.model_expression
        ),
      ),
    ),

    _model_heritage: $ => choice(
      $.model_is_heritage,
      $.model_extends_heritage,
    ),

    model_is_heritage: $ => seq("is", $._expression),
    model_extends_heritage: $ => seq("extends", $._expression),

    expression_list: $ => seq(
      $._expression,
      repeat(seq(",", $._expression)),
      optional(","),
    ),

    _expression: $ => choice(
      $.union_expression,
      $.intersection_expression,
      $.value_of_expression,
      $.array_expression,
      $._primary_expression,
    ),

    union_expression: $ => prec.left(1, seq(optional($._expression), "|", $._expression)),
    intersection_expression: $ => prec.left(2, seq(optional($._expression), "&", $._expression)),
    value_of_expression: $ => prec(3, seq("valueof", $._expression)),
    array_expression: $ => prec(4, seq($._primary_expression, "[", "]")),

    _primary_expression: $ => choice(
      $._literal,
      $.reference_expression,
      $.parenthesized_expression,
      $.model_expression,
      $.tuple_expression,
    ),

    tuple_expression: $ => seq("[", optional($.expression_list), "]"),

    model_expression: $ => seq("{", optional($.model_body), "}"),

    model_body: $ => repeat1($.model_property),

    model_property: $ => choice(
      $.model_spread_property,
      seq(
        optional($.decorator_list),
        choice($._identifier, $._string_literal),
        optional("?"),
        ":",
        $._expression,
        optional(choice(",", ";")),
      ),
    ),

    model_spread_property: $ => seq("...", $.reference_expression),

    scalar_statement: $ => seq(
      optional($.decorator_list),
      "scalar",
      $._identifier,
      optional($.template_parameters),
      optional($.scalar_extends),
      ";",
    ),

    scalar_extends: $ => seq("extends", $._expression),

    interface_statement: $ => seq(
      "interface",
      $._identifier,
      optional($.template_parameters),
      optional($.interface_heritage),
      "{",
      optional($.interface_body),
      "}",
    ),

    interface_heritage: $ => seq("extends", $.reference_expression_list),

    interface_body: $ => repeat1($.interface_member),

    interface_member: $ => seq(
      optional("op"),
      $._identifier,
      $._operation_signature,
      ";",
    ),

    enum_statement: $ => seq(
      optional($.decorator_list),
      "enum",
      $._identifier,
      "{",
      optional($.enum_body),
      "}",
    ),

    enum_body: $ => repeat1(choice(
      $.enum_spread_member,
      $.enum_member,
    )),

    enum_spread_member: $ => seq("...", $.reference_expression),

    enum_member: $ => seq(
      optional($.decorator_list),
      choice($._identifier, $._string_literal),
      optional($.enum_member_value),
      optional(choice(",", ";")),
    ),

    enum_member_value: $ => seq(
      ":",
      choice($._numeric_literal, $._string_literal)
    ),

    alias_statement: $ => seq(
      "alias",
      $._identifier,
      optional($.template_parameters),
      "=",
      $._expression,
      ";",
    ),

    augment_decorator_statement: $ => seq(
      "@@",
      $._identifier_or_member_expression,
      optional($.decorator_arguments),
    ),

    operation_statement: $ => seq(
      optional($.decorator_list),
      "op",
      $._identifier,
      optional($.template_parameters),
      $._operation_signature,
      ";",
    ),

    _operation_signature: $ => choice(
      $.operation_signature_declaration,
      $.operation_signature_reference,
    ),

    operation_signature_declaration: $ => seq(
      "(",
      repeat($.model_property),
      ")",
      ":",
      $._expression,
    ),

    operation_signature_reference: $ => seq("is", $.reference_expression,),

    // TODO: Missing statements here

    reference_expression_list: $ => seq(
      $.reference_expression,
      repeat(seq(",", $.reference_expression)),
      optional(","),
    ),

    reference_expression: $ => seq(
      $._identifier_or_member_expression,
      optional($.template_arguments),
    ),

    parenthesized_expression: $ => seq("(", $._expression, ")"),

    template_arguments: $ => seq("<", $.expression_list, ">"),

    template_parameters: $ => seq("<", $.template_parameter_list, ">"),

    template_parameter_list: $ => seq(
      $.template_parameter,
      repeat(seq(",", $.template_parameter)),
    ),

    template_parameter: $ => seq(
      $._identifier,
      optional($.template_constraint),
      optional($.template_default),
    ),

    template_constraint: $ => seq("extends", $._expression),

    template_default: $ => seq("=", $._expression),

    _identifier_or_member_expression: $ => choice(
      $._identifier,
      $.member_expression,
    ),

    _identifier: $ => choice(
      $.plain_identifier,
      $.backticked_identifier,
    ),

    plain_identifier: $ => /[a-zA-Z_][a-zA-Z0-9_$]*/,
    // TODO: Escape sequences
    backticked_identifier: $ => /`[^`]*`/,

    member_expression: $ => seq(
      $._identifier,
      repeat1(seq(".", $._identifier)),
    ),

    _literal: $ => choice(
      $._string_literal,
      $.boolean_literal,
      $._numeric_literal,
    ),

    boolean_literal: $ => choice("true", "false"),

    _numeric_literal: $ => choice(
      $.decimal_literal,
      $.hex_integer_literal,
      $.binary_integer_literal,
    ),

    decimal_literal: $ => token(
      seq(
        choice(
          seq(optional(choice("-", "+")), "0"),
          seq(optional(choice("-", "+")), /[1-9]/, /\d*/)
        ),
        optional(seq(".", /\d+/)),
        optional(seq("e", optional(/[+-]/), /\d+/))
      )
    ),

    hex_integer_literal: $ => token(seq("0x", /[0-9a-fA-F]+/)),
    binary_integer_literal: $ => token(seq("0b", /[01]+/)),

    _string_literal: $ => choice(
      $.quoted_string_literal,
      $.tripe_quoted_string_literal,
    ),

    quoted_string_literal: $ => seq(
      '"',
      repeat(choice(
        $.quoted_string_fragment,
        $.escape_sequence,
      )),
      '"',
    ),

    tripe_quoted_string_literal: $ => seq(
      '"""',
      repeat(choice(
        $.triple_quoted_string_fragment,
        $.escape_sequence,
      )),
      '"""',
    ),

    escape_sequence: $ => token.immediate(seq(
      '\\',
      /(\"|\\|r|n|t|`)/,
    )),

    quoted_string_fragment: _ => token.immediate(/[^"\\\r\n]+/),
    triple_quoted_string_fragment: _ => token.immediate(/[^"\\]+/),

    _comment: $ => choice(
      $.single_line_comment,
      $.multi_line_comment,
    ),

    single_line_comment: $ => token(seq("//", /[^\r\n]*/)),
    multi_line_comment: $ => token(seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
  },
})
