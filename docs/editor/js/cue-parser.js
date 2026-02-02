/**
 * CUE Schema Parser for Security Insights
 *
 * A subset parser that handles the specific CUE constructs used in the
 * Security Insights schema. This is not a full CUE parser, but handles:
 * - Type definitions (#TypeName)
 * - Struct fields (with optional ? modifier)
 * - Type references (#TypeName)
 * - String/bool primitive types
 * - List types ([...Type], [Type, ...])
 * - Disjunctions (type1 | type2)
 * - Regex constraints (=~"pattern")
 * - Comments (// style)
 * - Quoted field names ("field-name")
 *
 * Skips @go() attributes and import blocks.
 */

const CueParser = (function() {
  'use strict';

  // Token types
  const TokenType = {
    IDENTIFIER: 'IDENTIFIER',
    TYPE_DEF: 'TYPE_DEF',       // #TypeName
    STRING: 'STRING',           // "..."
    REGEX: 'REGEX',             // =~"..."
    LBRACE: 'LBRACE',           // {
    RBRACE: 'RBRACE',           // }
    LBRACKET: 'LBRACKET',       // [
    RBRACKET: 'RBRACKET',       // ]
    COLON: 'COLON',             // :
    QUESTION: 'QUESTION',       // ?
    PIPE: 'PIPE',               // |
    COMMA: 'COMMA',             // ,
    ELLIPSIS: 'ELLIPSIS',       // ...
    BOOL_TRUE: 'BOOL_TRUE',     // true
    BOOL_FALSE: 'BOOL_FALSE',   // false
    KEYWORD_STRING: 'KEYWORD_STRING',   // string
    KEYWORD_BOOL: 'KEYWORD_BOOL',       // bool
    COMMENT: 'COMMENT',         // // ...
    ATTRIBUTE: 'ATTRIBUTE',     // @go(...)
    LPAREN: 'LPAREN',           // (
    RPAREN: 'RPAREN',           // )
    EOF: 'EOF'
  };

  /**
   * Tokenizer - converts CUE source into tokens
   */
  class Tokenizer {
    constructor(source) {
      this.source = source;
      this.pos = 0;
      this.line = 1;
      this.column = 1;
      this.tokens = [];
      this.comments = {}; // Map line numbers to comments
    }

    peek(offset = 0) {
      return this.source[this.pos + offset] || '';
    }

    advance() {
      const ch = this.source[this.pos++];
      if (ch === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      return ch;
    }

    skipWhitespace() {
      while (this.pos < this.source.length) {
        const ch = this.peek();
        if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
          this.advance();
        } else {
          break;
        }
      }
    }

    readString() {
      const quote = this.advance(); // consume opening quote
      let value = '';
      while (this.pos < this.source.length) {
        const ch = this.peek();
        if (ch === '\\') {
          this.advance();
          const escaped = this.advance();
          // Handle common escapes
          switch (escaped) {
            case 'n': value += '\n'; break;
            case 't': value += '\t'; break;
            case 'r': value += '\r'; break;
            case '\\': value += '\\'; break;
            case '"': value += '"'; break;
            default: value += escaped;
          }
        } else if (ch === quote) {
          this.advance(); // consume closing quote
          break;
        } else {
          value += this.advance();
        }
      }
      return value;
    }

    readIdentifier() {
      let value = '';
      while (this.pos < this.source.length) {
        const ch = this.peek();
        if (/[a-zA-Z0-9_-]/.test(ch)) {
          value += this.advance();
        } else {
          break;
        }
      }
      return value;
    }

    readComment() {
      // Already consumed //
      let value = '';
      while (this.pos < this.source.length && this.peek() !== '\n') {
        value += this.advance();
      }
      return value.trim();
    }

    readAttribute() {
      // Already consumed @
      let value = '@';
      // Read the attribute name
      while (this.pos < this.source.length) {
        const ch = this.peek();
        if (/[a-zA-Z0-9_]/.test(ch)) {
          value += this.advance();
        } else {
          break;
        }
      }
      // Read parenthesized content if present
      if (this.peek() === '(') {
        let depth = 0;
        do {
          const ch = this.peek();
          if (ch === '(') depth++;
          if (ch === ')') depth--;
          value += this.advance();
        } while (depth > 0 && this.pos < this.source.length);
      }
      return value;
    }

    tokenize() {
      while (this.pos < this.source.length) {
        this.skipWhitespace();
        if (this.pos >= this.source.length) break;

        const startLine = this.line;
        const startCol = this.column;
        const ch = this.peek();

        // Comments
        if (ch === '/' && this.peek(1) === '/') {
          this.advance(); this.advance();
          const comment = this.readComment();
          // Store comment by line for later association
          if (!this.comments[startLine]) {
            this.comments[startLine] = [];
          }
          this.comments[startLine].push(comment);
          continue;
        }

        // Regex constraint: =~"..."
        if (ch === '=' && this.peek(1) === '~') {
          this.advance(); this.advance();
          this.skipWhitespace();
          if (this.peek() === '"') {
            const pattern = this.readString();
            this.tokens.push({
              type: TokenType.REGEX,
              value: pattern,
              line: startLine,
              column: startCol
            });
            continue;
          }
        }

        // Type definition: #TypeName
        if (ch === '#') {
          this.advance();
          const name = this.readIdentifier();
          this.tokens.push({
            type: TokenType.TYPE_DEF,
            value: '#' + name,
            line: startLine,
            column: startCol
          });
          continue;
        }

        // Attribute: @go(...)
        if (ch === '@') {
          this.advance();
          const attr = '@' + this.readIdentifier();
          // Skip the parenthesized content
          if (this.peek() === '(') {
            let depth = 0;
            do {
              const c = this.peek();
              if (c === '(') depth++;
              if (c === ')') depth--;
              this.advance();
            } while (depth > 0 && this.pos < this.source.length);
          }
          this.tokens.push({
            type: TokenType.ATTRIBUTE,
            value: attr,
            line: startLine,
            column: startCol
          });
          continue;
        }

        // Strings: "..."
        if (ch === '"') {
          const value = this.readString();
          this.tokens.push({
            type: TokenType.STRING,
            value: value,
            line: startLine,
            column: startCol
          });
          continue;
        }

        // Ellipsis: ...
        if (ch === '.' && this.peek(1) === '.' && this.peek(2) === '.') {
          this.advance(); this.advance(); this.advance();
          this.tokens.push({
            type: TokenType.ELLIPSIS,
            value: '...',
            line: startLine,
            column: startCol
          });
          continue;
        }

        // Single character tokens
        const singleChars = {
          '{': TokenType.LBRACE,
          '}': TokenType.RBRACE,
          '[': TokenType.LBRACKET,
          ']': TokenType.RBRACKET,
          ':': TokenType.COLON,
          '?': TokenType.QUESTION,
          '|': TokenType.PIPE,
          ',': TokenType.COMMA,
          '(': TokenType.LPAREN,
          ')': TokenType.RPAREN
        };

        if (singleChars[ch]) {
          this.advance();
          this.tokens.push({
            type: singleChars[ch],
            value: ch,
            line: startLine,
            column: startCol
          });
          continue;
        }

        // Identifiers and keywords
        if (/[a-zA-Z_]/.test(ch)) {
          const ident = this.readIdentifier();
          let type = TokenType.IDENTIFIER;

          // Check for keywords
          if (ident === 'string') type = TokenType.KEYWORD_STRING;
          else if (ident === 'bool') type = TokenType.KEYWORD_BOOL;
          else if (ident === 'true') type = TokenType.BOOL_TRUE;
          else if (ident === 'false') type = TokenType.BOOL_FALSE;
          else if (ident === 'import' || ident === 'package') {
            // Skip import and package blocks
            this.skipWhitespace();
            if (this.peek() === '(') {
              let depth = 0;
              do {
                const c = this.peek();
                if (c === '(') depth++;
                if (c === ')') depth--;
                this.advance();
              } while (depth > 0 && this.pos < this.source.length);
            }
            continue;
          }

          this.tokens.push({
            type: type,
            value: ident,
            line: startLine,
            column: startCol
          });
          continue;
        }

        // Skip unknown characters
        this.advance();
      }

      this.tokens.push({
        type: TokenType.EOF,
        value: '',
        line: this.line,
        column: this.column
      });

      return { tokens: this.tokens, comments: this.comments };
    }
  }

  /**
   * Parser - converts tokens into AST
   */
  class Parser {
    constructor(tokens, comments) {
      this.tokens = tokens;
      this.comments = comments;
      this.pos = 0;
      this.types = {};
    }

    peek(offset = 0) {
      return this.tokens[this.pos + offset] || { type: TokenType.EOF };
    }

    advance() {
      return this.tokens[this.pos++];
    }

    expect(type) {
      const token = this.peek();
      if (token.type !== type) {
        throw new Error(`Expected ${type} but got ${token.type} at line ${token.line}`);
      }
      return this.advance();
    }

    check(type) {
      return this.peek().type === type;
    }

    match(...types) {
      for (const type of types) {
        if (this.check(type)) {
          return this.advance();
        }
      }
      return null;
    }

    // Get comments preceding a line
    getCommentsForLine(line) {
      const result = [];
      // Look for comments on lines immediately before
      for (let i = line - 1; i >= 1 && this.comments[i]; i--) {
        result.unshift(...this.comments[i]);
        // Stop if there's a gap
        if (!this.comments[i - 1]) break;
      }
      return result.join(' ');
    }

    // Parse the entire schema
    parse() {
      while (!this.check(TokenType.EOF)) {
        this.skipAttributes();

        if (this.check(TokenType.TYPE_DEF)) {
          this.parseTypeDefinition();
        } else {
          this.advance(); // Skip unexpected tokens
        }
      }

      return this.types;
    }

    skipAttributes() {
      while (this.check(TokenType.ATTRIBUTE)) {
        this.advance();
      }
    }

    parseTypeDefinition() {
      const nameToken = this.expect(TokenType.TYPE_DEF);
      const typeName = nameToken.value;
      const description = this.getCommentsForLine(nameToken.line);

      this.expect(TokenType.COLON);
      this.skipAttributes();

      const typeValue = this.parseTypeValue();

      this.types[typeName] = {
        name: typeName,
        description: description,
        ...typeValue
      };
    }

    parseTypeValue() {
      this.skipAttributes();

      // Regex constraint: =~"pattern" (already tokenized as REGEX)
      if (this.check(TokenType.REGEX)) {
        const token = this.advance();
        return {
          kind: 'primitive',
          type: 'string',
          pattern: token.value
        };
      }

      // time.Format(...) - treat as string with format constraint
      if (this.check(TokenType.IDENTIFIER) && this.peek().value === 'time') {
        this.advance(); // time
        if (this.check(TokenType.IDENTIFIER) && this.peek().value === 'Format') {
          this.advance(); // Format (might be .Format)
        }
        // Skip the parenthesized format string
        if (this.check(TokenType.LPAREN)) {
          this.advance();
          const format = this.check(TokenType.STRING) ? this.advance().value : '';
          if (this.check(TokenType.RPAREN)) this.advance();
          return {
            kind: 'primitive',
            type: 'date',
            format: format
          };
        }
      }

      // Check for . before Format (time.Format)
      if (this.check(TokenType.IDENTIFIER) && this.peek().value === 'Format') {
        this.advance();
        if (this.check(TokenType.LPAREN)) {
          this.advance();
          const format = this.check(TokenType.STRING) ? this.advance().value : '';
          if (this.check(TokenType.RPAREN)) this.advance();
          return {
            kind: 'primitive',
            type: 'date',
            format: format
          };
        }
      }

      // Struct: { ... }
      if (this.check(TokenType.LBRACE)) {
        return this.parseStruct();
      }

      // Array: [ ... ]
      if (this.check(TokenType.LBRACKET)) {
        return this.parseArray();
      }

      // Type reference: #TypeName
      if (this.check(TokenType.TYPE_DEF)) {
        const token = this.advance();
        return {
          kind: 'reference',
          ref: token.value
        };
      }

      // Primitive: string
      if (this.check(TokenType.KEYWORD_STRING)) {
        this.advance();
        return {
          kind: 'primitive',
          type: 'string'
        };
      }

      // Primitive: bool
      if (this.check(TokenType.KEYWORD_BOOL)) {
        this.advance();
        return {
          kind: 'primitive',
          type: 'bool'
        };
      }

      // String literal (for enum values)
      if (this.check(TokenType.STRING)) {
        return this.parseDisjunction();
      }

      // Boolean literal
      if (this.check(TokenType.BOOL_TRUE) || this.check(TokenType.BOOL_FALSE)) {
        const token = this.advance();
        return {
          kind: 'literal',
          type: 'bool',
          value: token.type === TokenType.BOOL_TRUE
        };
      }

      // Unknown - skip
      this.advance();
      return { kind: 'unknown' };
    }

    parseStruct() {
      this.expect(TokenType.LBRACE);
      const fields = {};

      while (!this.check(TokenType.RBRACE) && !this.check(TokenType.EOF)) {
        this.skipAttributes();

        if (this.check(TokenType.RBRACE)) break;

        // Field name can be identifier or quoted string
        let fieldName;
        let fieldLine;

        if (this.check(TokenType.IDENTIFIER)) {
          const token = this.advance();
          fieldName = token.value;
          fieldLine = token.line;
        } else if (this.check(TokenType.STRING)) {
          const token = this.advance();
          fieldName = token.value;
          fieldLine = token.line;
        } else if (this.check(TokenType.TYPE_DEF)) {
          // Could be an embedded type - skip for now
          this.advance();
          continue;
        } else {
          this.advance();
          continue;
        }

        // Check for optional marker
        const optional = !!this.match(TokenType.QUESTION);

        this.expect(TokenType.COLON);
        this.skipAttributes();

        const description = this.getCommentsForLine(fieldLine);
        const fieldType = this.parseFieldType();

        this.skipAttributes();

        fields[fieldName] = {
          name: fieldName,
          optional: optional,
          description: description,
          ...fieldType
        };
      }

      this.expect(TokenType.RBRACE);

      return {
        kind: 'struct',
        fields: fields
      };
    }

    parseFieldType() {
      // Check for disjunction (enum) starting with string literal
      if (this.check(TokenType.STRING)) {
        return this.parseDisjunction();
      }

      // Check for disjunction starting with array literal
      if (this.check(TokenType.LBRACKET)) {
        const firstArray = this.parseArray();
        if (this.check(TokenType.PIPE)) {
          // This is a disjunction like ["default"] | [...string]
          this.advance();
          const secondType = this.parseFieldType();
          return {
            kind: 'disjunction',
            options: [firstArray, secondType]
          };
        }
        return firstArray;
      }

      return this.parseTypeValue();
    }

    parseDisjunction() {
      const options = [];

      // First option
      if (this.check(TokenType.STRING)) {
        options.push({
          kind: 'literal',
          type: 'string',
          value: this.advance().value
        });
      }

      // Additional options
      while (this.check(TokenType.PIPE)) {
        this.advance();
        if (this.check(TokenType.STRING)) {
          options.push({
            kind: 'literal',
            type: 'string',
            value: this.advance().value
          });
        } else if (this.check(TokenType.LBRACKET)) {
          options.push(this.parseArray());
        } else {
          options.push(this.parseTypeValue());
        }
      }

      if (options.length === 1) {
        return options[0];
      }

      // Check if all options are string literals (enum)
      const allStringLiterals = options.every(
        o => o.kind === 'literal' && o.type === 'string'
      );

      if (allStringLiterals) {
        return {
          kind: 'enum',
          values: options.map(o => o.value)
        };
      }

      return {
        kind: 'disjunction',
        options: options
      };
    }

    parseArray() {
      this.expect(TokenType.LBRACKET);

      // Empty array with ellipsis: [...]
      if (this.check(TokenType.ELLIPSIS)) {
        this.advance();
        const itemType = this.parseArrayItemType();
        this.expect(TokenType.RBRACKET);
        return {
          kind: 'array',
          itemType: itemType,
          minItems: 0
        };
      }

      // Array with literal values like ["default"]
      if (this.check(TokenType.STRING)) {
        const values = [];
        values.push(this.advance().value);
        while (this.check(TokenType.COMMA)) {
          this.advance();
          if (this.check(TokenType.STRING)) {
            values.push(this.advance().value);
          }
        }
        this.expect(TokenType.RBRACKET);
        return {
          kind: 'array-literal',
          values: values
        };
      }

      // Non-empty array: [#Type, ...]
      if (this.check(TokenType.TYPE_DEF)) {
        const itemType = this.parseTypeValue();
        this.match(TokenType.COMMA);
        const hasEllipsis = !!this.match(TokenType.ELLIPSIS);
        this.expect(TokenType.RBRACKET);
        return {
          kind: 'array',
          itemType: itemType,
          minItems: hasEllipsis ? 1 : 1 // [#Type, ...] means 1 or more
        };
      }

      // Default: empty array
      this.expect(TokenType.RBRACKET);
      return {
        kind: 'array',
        itemType: { kind: 'unknown' },
        minItems: 0
      };
    }

    parseArrayItemType() {
      if (this.check(TokenType.TYPE_DEF)) {
        return this.parseTypeValue();
      }
      if (this.check(TokenType.KEYWORD_STRING)) {
        this.advance();
        return { kind: 'primitive', type: 'string' };
      }
      if (this.check(TokenType.KEYWORD_BOOL)) {
        this.advance();
        return { kind: 'primitive', type: 'bool' };
      }
      return { kind: 'unknown' };
    }
  }

  /**
   * Main parsing function
   */
  function parse(source) {
    const tokenizer = new Tokenizer(source);
    const { tokens, comments } = tokenizer.tokenize();

    const parser = new Parser(tokens, comments);
    const types = parser.parse();

    // Post-process to resolve references and build complete schema
    return processSchema(types);
  }

  /**
   * Post-process the parsed types to create a usable schema
   */
  function processSchema(types) {
    const schema = {
      version: '2.2.0',
      root: '#SecurityInsights',
      types: types,

      // Helper method to get a type definition
      getType(name) {
        return this.types[name];
      },

      // Helper to resolve a type reference to its full definition
      resolveType(typeValue) {
        if (typeValue.kind === 'reference') {
          return this.types[typeValue.ref];
        }
        return typeValue;
      },

      // Get all enum values for a field
      getEnumValues(typeValue) {
        if (typeValue.kind === 'enum') {
          return typeValue.values;
        }
        if (typeValue.kind === 'disjunction') {
          const values = [];
          for (const opt of typeValue.options) {
            if (opt.kind === 'literal' && opt.type === 'string') {
              values.push(opt.value);
            }
          }
          return values.length > 0 ? values : null;
        }
        return null;
      },

      // Check if a field is required
      isRequired(field) {
        return !field.optional;
      },

      // Get validation pattern for a type
      getPattern(typeValue) {
        if (typeValue.kind === 'primitive' && typeValue.pattern) {
          return typeValue.pattern;
        }
        if (typeValue.kind === 'reference') {
          const resolved = this.types[typeValue.ref];
          if (resolved && resolved.pattern) {
            return resolved.pattern;
          }
        }
        return null;
      }
    };

    return schema;
  }

  /**
   * Fetch and parse schema from URL
   */
  async function fetchAndParse(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
    }
    const source = await response.text();
    return parse(source);
  }

  // Public API
  return {
    parse,
    fetchAndParse,
    TokenType
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CueParser;
}
