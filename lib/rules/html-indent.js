/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
'use strict'

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const utils = require('../utils')

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

const KNOWN_NODES = new Set(['ArrayExpression', 'ArrayPattern', 'ArrowFunctionExpression', 'AssignmentExpression', 'AssignmentPattern', 'AwaitExpression', 'BinaryExpression', 'BlockStatement', 'BreakStatement', 'CallExpression', 'CatchClause', 'ClassBody', 'ClassDeclaration', 'ClassExpression', 'ConditionalExpression', 'ContinueStatement', 'DebuggerStatement', 'DoWhileStatement', 'EmptyStatement', 'ExperimentalRestProperty', 'ExperimentalSpreadProperty', 'ExpressionStatement', 'ForInStatement', 'ForOfStatement', 'ForStatement', 'FunctionDeclaration', 'FunctionExpression', 'Identifier', 'IfStatement', 'LabeledStatement', 'Literal', 'LogicalExpression', 'MemberExpression', 'MetaProperty', 'MethodDefinition', 'NewExpression', 'ObjectExpression', 'ObjectPattern', 'Program', 'Property', 'RestElement', 'ReturnStatement', 'SequenceExpression', 'SpreadElement', 'Super', 'SwitchCase', 'SwitchStatement', 'TaggedTemplateExpression', 'TemplateElement', 'TemplateLiteral', 'ThisExpression', 'ThrowStatement', 'TryStatement', 'UnaryExpression', 'UpdateExpression', 'VariableDeclaration', 'VariableDeclarator', 'WhileStatement', 'WithStatement', 'YieldExpression', 'VAttribute', 'VDirectiveKey', 'VDocumentFragment', 'VElement', 'VEndTag', 'VExpressionContainer', 'VForExpression', 'VIdentifier', 'VLiteral', 'VOnExpression', 'VStartTag', 'VText'])
const LT_CHAR = /[\r\n\u2028\u2029]/
const EXACT = -1

/**
 * Normalize options.
 * @param {"tab"|number|undefined} kind The kind of indentation.
 * @param {Object|undefined} options Other options.
 * @returns {{indentChar:" "|"\t",indentSize:number,attribute:number,closeBracket:number}} Normalized options.
 */
function parseOptions (kind, options) {
  const ret = {
    indentChar: ' ',
    indentSize: 4,
    attribute: 1,
    closeBracket: 0
  }

  if (kind === 'tab') {
    ret.indentChar = '\t'
    ret.indentSize = 1
  } else if (Number.isSafeInteger(kind)) {
    ret.indentSize = kind
  }

  if (Number.isSafeInteger(options && options.attribute)) {
    ret.attribute = options.attribute
  }
  if (Number.isSafeInteger(options && options.closeBracket)) {
    ret.closeBracket = options.closeBracket
  }

  return ret
}

/**
 * Check whether the given token is an arrow.
 * @param {Token} token The token to check.
 * @returns {boolean} `true` if the token is an arrow.
 */
function isArrow (token) {
  return token != null && token.type === 'Punctuator' && token.value === '=>'
}

/**
 * Check whether the given token is a left parenthesis.
 * @param {Token} token The token to check.
 * @returns {boolean} `true` if the token is a left parenthesis.
 */
function isLeftParen (token) {
  return token != null && token.type === 'Punctuator' && token.value === '('
}

/**
 * Check whether the given token is a left parenthesis.
 * @param {Token} token The token to check.
 * @returns {boolean} `false` if the token is a left parenthesis.
 */
function isNotLeftParen (token) {
  return token != null && (token.type !== 'Punctuator' || token.value !== '(')
}

/**
 * Check whether the given token is a right parenthesis.
 * @param {Token} token The token to check.
 * @returns {boolean} `true` if the token is a right parenthesis.
 */
function isRightParen (token) {
  return token != null && token.type === 'Punctuator' && token.value === ')'
}

/**
 * Check whether the given token is a right parenthesis.
 * @param {Token} token The token to check.
 * @returns {boolean} `false` if the token is a right parenthesis.
 */
function isNotRightParen (token) {
  return token != null && (token.type !== 'Punctuator' || token.value !== ')')
}

/**
 * Check whether the given token is a left brace.
 * @param {Token} token The token to check.
 * @returns {boolean} `true` if the token is a left brace.
 */
function isLeftBrace (token) {
  return token != null && token.type === 'Punctuator' && token.value === '{'
}

/**
 * Check whether the given token is a left bracket.
 * @param {Token} token The token to check.
 * @returns {boolean} `true` if the token is a left bracket.
 */
function isLeftBracket (token) {
  return token != null && token.type === 'Punctuator' && token.value === '['
}

/**
 * Check whether the given token is a right bracket.
 * @param {Token} token The token to check.
 * @returns {boolean} `true` if the token is a right bracket.
 */
function isRightBracket (token) {
  return token != null && token.type === 'Punctuator' && token.value === ']'
}

/**
 * Check whether the given token is a semicolon.
 * @param {Token} token The token to check.
 * @returns {boolean} `true` if the token is a semicolon.
 */
function isSemicolon (token) {
  return token != null && token.type === 'Punctuator' && token.value === ';'
}

/**
 * Check whether the given token is a whitespace.
 * @param {Token} token The token to check.
 * @returns {boolean} `true` if the token is a whitespace.
 */
function isNotWhitespace (token) {
  return token != null && token.type !== 'HTMLWhitespace'
}

/**
 * Check whether the given token is a comment.
 * @param {Token} token The token to check.
 * @returns {boolean} `true` if the token is a comment.
 */
function isComment (token) {
  return token != null && token.type.endsWith('Comment')
}

/**
 * Check whether the given token is a comment.
 * @param {Token} token The token to check.
 * @returns {boolean} `false` if the token is a comment.
 */
function isNotComment (token) {
  return token != null && !token.type.endsWith('Comment')
}

/**
 * Get the last element.
 * @param {Array} xs The array to get the last element.
 * @returns {any|undefined} The last element or undefined.
 */
function last (xs) {
  return xs.length === 0 ? undefined : xs[xs.length - 1]
}

/**
 * Creates AST event handlers for html-indent.
 *
 * @param {RuleContext} context - The rule context.
 * @returns {object} AST event handlers.
 */
function create (context) {
  const options = parseOptions(context.options[0], context.options[1])
  const sourceCode = context.getSourceCode()
  const template = context.parserServices.getTemplateBodyTokenStore && context.parserServices.getTemplateBodyTokenStore()
  const offsets = new Map()

  /**
   * Set offset to the given tokens.
   * @param {Token|Token[]} tokens The tokens to set.
   * @param {number} offset The offset of the tokens.
   * @param {Token} baseToken The token of the base offset.
   * @returns {void}
   */
  function setOffset (tokens, offset, baseToken) {
    const info = { baseToken, offset }

    if (Array.isArray(tokens)) {
      for (const token of tokens) {
        offsets.set(token, info)
      }
    } else {
      offsets.set(tokens, info)
    }
  }

  /**
   * Process parentheses which enclose the given node.
   * Set one offset to the tokens from the parentheses.
   * @param {Node|Token[]} nodeOrTokens The tokens to process.
   */
  function processParentheses (nodeOrTokens) {
    let firstToken = Array.isArray(nodeOrTokens) ? nodeOrTokens[0] : template.getFirstToken(nodeOrTokens)
    let leftToken = template.getTokenBefore(firstToken)
    let rightToken = template.getTokenAfter(
      Array.isArray(nodeOrTokens) ? last(nodeOrTokens) : template.getLastToken(nodeOrTokens)
    )

    while (isLeftParen(leftToken) && isRightParen(rightToken)) {
      setOffset(firstToken, 1, leftToken)
      setOffset(rightToken, 0, leftToken)

      firstToken = leftToken
      leftToken = template.getTokenBefore(leftToken)
      rightToken = template.getTokenAfter(rightToken)
    }
  }

  /**
   * Process the given node list.
   * The first node is offsetted from the given left token.
   * Rest nodes are adjusted to the first node.
   * @param {NodeList} nodeList The node to process.
   * @param {boolean} canParenthized If `true` then the node can be parenthized.
   * @returns {void}
   */
  function processNodeList (nodeList, leftToken, rightToken, offset) {
    if (nodeList.length !== 0) {
      // For holes at the head of arrays, process commas until the first element.
      {
        const end = nodeList[0].range[0]
        let token = template.getTokenAfter(leftToken)
        while (token.range[1] <= end) {
          setOffset(token, offset, leftToken)
          token = template.getTokenAfter(token)
        }
      }

      // Process nodes
      let baseToken = leftToken
      for (let i = 0; i < nodeList.length; ++i) {
        const node = nodeList[i]
        if (node == null) {
          continue
        }

        const token = template.getFirstToken(node)
        setOffset(token, offset, baseToken)

        // Rest nodes are adjusted to the first one.
        baseToken = token
        offset = EXACT

        // For holes at the head of arrays, process commas until the next element.
        const nextToken = nodeList[i + 1] || rightToken
        if (nextToken != null) {
          let token = template.getTokenAfter(node)
          while (token.range[1] <= nextToken.range[0]) {
            setOffset(token, offset, baseToken)
            token = template.getTokenAfter(token)
          }
        }
      }
    }

    if (rightToken != null) {
      setOffset(rightToken, 0, leftToken)
    }
  }

  /**
   * Process the given node as body.
   * The body node maybe a block statement or an expression node.
   * @param {Node} node The body node to process.
   * @param {Token} baseToken The base token.
   * @returns {void}
   */
  function processMaybeBlock (node, baseToken) {
    let firstToken = template.getFirstToken(node)

    // If this is parenthized, find the first open parenthesis.
    let t
    while ((t = template.getTokenBefore(firstToken)) && isLeftParen(t)) {
      firstToken = t
    }

    // Set
    setOffset(firstToken, isLeftBrace(firstToken) ? 0 : 1, baseToken)
  }

  /**
   * Set zero-offset to semicolon.
   * @param {Node} node The statement node to process.
   * @returns {void}
   */
  function processSemicolon (node) {
    const firstToken = template.getFirstToken(node)
    const lastToken = template.getLastToken(node)

    if (isSemicolon(lastToken) && lastToken !== firstToken) {
      setOffset(lastToken, 0, firstToken)
    }
  }

  /**
   * Collect prefix tokens of the given property.
   * The prefix includes `async`, `get`, `set`, `static`, and `*`.
   * @param {Property|MethodDefinition} node The property node to collect prefix tokens.
   */
  function getPrefixTokens (node) {
    const prefixes = []

    let prevToken = template.getFirstToken(node)
    let token = template.getTokenAfter(prevToken)
    while (token != null && !isLeftParen(token) && !isLeftBracket(prevToken)) {
      prefixes.push(prevToken)
      prevToken = token
      token = template.getTokenAfter(token)
    }

    return prefixes
  }

  /**
   * Find the head of chaining nodes.
   * @param {Node} node The start node to find the head.
   * @returns {Token} The head token of the chain.
   */
  function getChainHeadToken (node) {
    const type = node.type
    while (node.parent.type === type) {
      node = node.parent
    }
    return template.getFirstToken(node)
  }

  function getExpectedIndent (tokens, indents) {
    const firstOffsetInfo = offsets.get(tokens[0])

    if (firstOffsetInfo != null && firstOffsetInfo.offset === EXACT) {
      return firstOffsetInfo.baseToken.loc.start.column
    }

    return tokens.reduce((ret, t) => {
      const offsetInfo = offsets.get(t)
      if (offsetInfo != null) {
        const baseIndent = indents[offsetInfo.baseToken.loc.start.line]
        if (Number.isInteger(baseIndent)) {
          return Math.min(ret, options.indentSize * offsetInfo.offset + baseIndent)
        }
      }
      return ret
    }, Number.MAX_SAFE_INTEGER)
  }

  /**
   * Get the text of the indentation part of the line which the given token is on.
   * @param {Token} firstToken The first token on a line.
   * @returns {string} The text of indentation part.
   */
  function getIndentText (firstToken) {
    const text = sourceCode.text
    let i = firstToken.range[0] - 1

    while (i >= 0 && !LT_CHAR.test(text[i])) {
      i -= 1
    }

    return text.slice(i + 1, firstToken.range[0])
  }

  /**
   * Validate the given token with the pre-calculated expected indentation.
   * @param {Token} token The token to validate.
   * @param {number} expectedIndent The expected indentation.
   * @returns {void}
   */
  function validateCore (token, expectedIndent) {
    const line = token.loc.start.line
    const actualIndent = token.loc.start.column
    const indentText = getIndentText(token)
    const unit = (options.indentChar === '\t' ? 'tab' : 'space')

    for (let i = 0; i < indentText.length; ++i) {
      if (indentText[i] !== options.indentChar) {
        context.report({
          loc: {
            start: { line, column: i },
            end: { line, column: i + 1 }
          },
          message: 'Expected {{expected}} character, but found {{actual}} character.',
          data: {
            expected: JSON.stringify(options.indentChar),
            actual: JSON.stringify(indentText[i])
          }
        })
        return
      }
    }

    if (actualIndent !== expectedIndent) {
      context.report({
        loc: {
          start: { line, column: 0 },
          end: { line, column: actualIndent }
        },
        message: 'Expected indentation of {{expectedIndent}} {{unit}}{{expectedIndentPlural}} but found {{actualIndent}} {{unit}}{{actualIndentPlural}}.',
        data: {
          expectedIndent,
          actualIndent,
          unit,
          expectedIndentPlural: (expectedIndent === 1) ? '' : 's',
          actualIndentPlural: (actualIndent === 1) ? '' : 's'
        }
      })
    }
  }

  /**
   * Validate indentation of the line that the given tokens are on.
   * @param {Token[]} tokens The tokens on the same line to validate.
   * @param {Token[]} comments The comments which are on the immediately previous lines of the tokens.
   * @param {number[]} indents The array of expected indentations. Their indices are line numbers, their values are indents.
   * @returns {void}
   */
  function validate (tokens, comments, indents) {
    if (!offsets.has(tokens.find(isNotComment))) {
      // This line is in unknown nodes. Ignore.
      return
    }

    // Calculate and save expected indentation.
    const firstToken = tokens[0]
    const expectedIndent = indents[firstToken.loc.start.line] = getExpectedIndent(tokens, indents)

    // Validate.
    validateCore(firstToken, expectedIndent)
    for (const comment of comments) {
      validateCore(comment, expectedIndent)
    }
  }

  // ------------------------------------------------------------------------------
  // Main
  // ------------------------------------------------------------------------------

  utils.registerTemplateBodyVisitor(context, {
    VAttribute (node) {
      const keyToken = template.getFirstToken(node)
      const eqToken = template.getFirstToken(node, 1)

      if (eqToken != null) {
        setOffset(eqToken, 1, keyToken)

        const valueToken = template.getFirstToken(node, 2)
        if (valueToken != null) {
          setOffset(valueToken, 1, eqToken)
        }
      }
    },

    VElement (node) {
      const startTagToken = template.getFirstToken(node)
      const childTokens = node.children.map(n => template.getFirstToken(n))
      const endTagToken = node.endTag && template.getFirstToken(node.endTag)

      setOffset(childTokens, 1, startTagToken)
      setOffset(endTagToken, 0, startTagToken)
    },

    VEndTag (node) {
      const openToken = template.getFirstToken(node)
      const closeToken = template.getLastToken(node)

      if (closeToken.type.endsWith('TagClose')) {
        setOffset(closeToken, options.closeBracket, openToken)
      }
    },

    VExpressionContainer (node) {
      if (node.expression != null && node.range[0] !== node.expression.range[0]) {
        const baseToken = template.getFirstToken(node)
        const childTokens = template.getTokens(node.expression)
        setOffset(childTokens, 1, baseToken)
      }
    },

    VForExpression (node) {
      const firstToken = template.getFirstToken(node)
      const lastOfLeft = last(node.left) || firstToken
      const inToken = template.getTokenAfter(lastOfLeft, isNotRightParen)
      const rightToken = template.getFirstToken(node.right)

      if (isLeftParen(firstToken)) {
        const rightToken = template.getTokenAfter(lastOfLeft, isRightParen)
        processNodeList(node.left, firstToken, rightToken, 1)
      }
      setOffset(inToken, 1, firstToken)
      setOffset(rightToken, 1, inToken)
    },

    VStartTag (node) {
      const openToken = template.getFirstToken(node)
      const closeToken = template.getLastToken(node)

      processNodeList(node.attributes, openToken, null, options.attribute)
      if (closeToken != null && closeToken.type.endsWith('TagClose')) {
        setOffset(closeToken, options.closeBracket, openToken)
      }
    },

    VText (node) {
      const tokens = template.getTokens(node, isNotWhitespace)
      const firstTokenInfo = offsets.get(template.getFirstToken(node))

      for (const token of tokens) {
        offsets.set(token, firstTokenInfo)
      }
    },

    'ArrayExpression, ArrayPattern, BlockStatement, ClassBody, ObjectExpression, ObjectPattern' (node) {
      processParentheses(node)
      processNodeList(node.elements, template.getFirstToken(node), template.getLastToken(node), 1)
    },

    ArrowFunctionExpression (node) {
      processParentheses(node)

      const firstToken = template.getFirstToken(node)
      const secondToken = template.getTokenAfter(firstToken)
      const leftToken = node.async ? secondToken : firstToken
      const arrowToken = template.getTokenBefore(node.body, isArrow)

      if (node.async) {
        setOffset(secondToken, 1, firstToken)
      }
      if (isLeftParen(leftToken)) {
        const rightToken = template.getTokenAfter(last(node.parens) || leftToken, isRightParen)
        processNodeList(node.params, leftToken, rightToken, 1)
      }

      setOffset(arrowToken, 1, firstToken)
      processMaybeBlock(node.body, arrowToken)
    },

    'AssignmentExpression, AssignmentPattern, BinaryExpression, LogicalExpression' (node) {
      processParentheses(node)

      const leftToken = template.getFirstToken(node)
      const opToken = template.getFirstTokenBetween(node.left, node.right, token => token.value === node.operator)
      const rightToken = template.getTokenAfter(opToken)

      setOffset(opToken, 1, leftToken)
      setOffset(rightToken, 1, opToken)
    },

    'AwaitExpression, RestElement, SpreadElement, UnaryExpression, UpdateExpression, YieldExpression' (node) {
      processParentheses(node)

      const firstToken = template.getFirstToken(node)
      const nextToken = template.getTokenAfter(firstToken)

      setOffset(nextToken, 1, firstToken)
    },

    'BreakStatement, ContinueStatement, ReturnStatement, ThrowStatement' (node) {
      const firstToken = template.getFirstToken(node)
      const nextToken = template.getTokenAfter(firstToken)

      setOffset(nextToken, 1, firstToken)
      processSemicolon(node)
    },

    CallExpression (node) {
      processParentheses(node)

      const firstToken = template.getFirstToken(node)
      const rightToken = template.getLastToken(node)
      const leftToken = isRightParen(rightToken)
        ? template.getFirstTokenBetween(node.callee, rightToken, isLeftParen)
        : null

      if (leftToken != null) {
        setOffset(leftToken, 1, firstToken)
        processNodeList(node.arguments, leftToken, rightToken, 1)
      }
    },

    CatchClause (node) {
      const firstToken = template.getFirstToken(node)
      const leftToken = template.getTokenAfter(firstToken)
      const rightToken = template.getTokenAfter(node.param)
      const bodyToken = template.getFirstToken(node.body)

      setOffset(leftToken, 1, firstToken)
      processNodeList([node.param], leftToken, rightToken, 1)
      setOffset(bodyToken, 0, firstToken)
    },

    'ClassDeclaration, ClassExpression' (node) {
      processParentheses(node)

      const firstToken = template.getFirstToken(node)
      const bodyToken = template.getFirstToken(node.body)

      if (node.id != null) {
        setOffset(template.getFirstToken(node.id), 1, firstToken)
      }
      if (node.superClass != null) {
        const extendsToken = template.getTokenAfter(node.id || firstToken)
        const superClassToken = template.getTokenAfter(extendsToken)
        setOffset(extendsToken, 1, firstToken)
        setOffset(superClassToken, 1, extendsToken)
      }
      setOffset(bodyToken, 0, firstToken)
    },

    ConditionalExpression (node) {
      processParentheses(node)

      const headToken = getChainHeadToken(node)
      const questionToken = template.getTokenAfter(node.test, isNotRightParen)
      const consequentToken = template.getTokenAfter(questionToken)
      const colonToken = template.getTokenAfter(node.consequent, isNotRightParen)
      const alternateToken = template.getTokenAfter(colonToken)
      const isFlat = (node.test.loc.end.line === node.consequent.loc.start.line)

      if (isFlat) {
        setOffset([questionToken, consequentToken, colonToken, alternateToken], 0, headToken)
      } else {
        setOffset([questionToken, colonToken], 1, headToken)
        setOffset(consequentToken, 1, questionToken)
        setOffset(alternateToken, 1, colonToken)
      }
    },

    DoWhileStatement (node) {
      const doToken = template.getFirstToken(node)
      const whileToken = template.getTokenAfter(node.body, isNotRightParen)
      const leftToken = template.getTokenAfter(whileToken)
      const testToken = template.getTokenAfter(leftToken)
      const lastToken = template.getLastToken(node)
      const rightToken = isSemicolon(lastToken) ? template.getTokenBefore(lastToken) : lastToken

      processMaybeBlock(node.body, doToken)
      setOffset(whileToken, 0, doToken)
      setOffset(leftToken, 1, whileToken)
      setOffset(testToken, 1, leftToken)
      setOffset(rightToken, 0, leftToken)
      processSemicolon(node)
    },

    ExpressionStatement (node) {
      processSemicolon(node)
    },

    'ForInStatement, ForOfStatement' (node) {
      const forToken = template.getFirstToken(node)
      const leftParenToken = template.getTokenAfter(forToken)
      const leftToken = template.getTokenAfter(leftParenToken)
      const inToken = template.getTokenAfter(leftToken, isNotRightParen)
      const rightToken = template.getTokenAfter(inToken)
      const rightParenToken = template.getTokenBefore(node.body, isNotLeftParen)

      setOffset(leftParenToken, 1, forToken)
      setOffset(leftToken, 1, leftParenToken)
      setOffset(inToken, 1, leftParenToken)
      setOffset(rightToken, 1, inToken)
      setOffset(rightParenToken, 0, leftParenToken)
      processMaybeBlock(node.body, forToken)
    },

    ForStatement (node) {
      const forToken = template.getFirstToken(node)
      const leftParenToken = template.getTokenAfter(forToken)
      const rightParenToken = template.getTokenBefore(node.body, isNotLeftParen)

      setOffset(leftParenToken, 1, forToken)
      processNodeList([node.init, node.test, node.update], leftParenToken, rightParenToken, 1)
      setOffset(rightParenToken, 0, leftParenToken)
      processMaybeBlock(node.body, forToken)
    },

    'FunctionDeclaration, FunctionExpression' (node) {
      processParentheses(node)

      const firstToken = template.getFirstToken(node)
      if (isLeftParen(firstToken)) {
        // Methods.
        const leftToken = firstToken
        const rightToken = template.getTokenAfter(last(node.params) || leftToken, isRightParen)
        const bodyToken = template.getFirstToken(node.body)

        processNodeList(node.params, leftToken, rightToken, 1)
        setOffset(bodyToken, 0, firstToken)
      } else {
        // Normal functions.
        const functionToken = node.async ? template.getTokenAfter(firstToken) : firstToken
        const starToken = node.generator ? template.getTokenAfter(functionToken) : null
        const idToken = node.id && template.getFirstToken(node.id)
        const leftToken = template.getTokenAfter(idToken || starToken || functionToken)
        const rightToken = template.getTokenAfter(last(node.params) || leftToken, isRightParen)
        const bodyToken = template.getFirstToken(node.body)

        if (node.async) {
          setOffset(functionToken, 1, firstToken)
        }
        if (node.generator) {
          setOffset(starToken, 1, functionToken)
        }
        if (node.id != null) {
          setOffset(idToken, 1, starToken || functionToken)
        }
        setOffset(leftToken, 1, idToken || starToken || functionToken)
        processNodeList(node.params, leftToken, rightToken, 1)
        setOffset(bodyToken, 0, firstToken)
      }
    },

    'Identifier, Literal, Super, ThisExpression' (node) {
      processParentheses(node)
    },

    IfStatement (node) {
      const ifToken = template.getFirstToken(node)
      const ifLeftParenToken = template.getTokenAfter(ifToken)
      const ifRightParenToken = template.getTokenBefore(node.consequent, isRightParen)

      setOffset(ifLeftParenToken, 1, ifToken)
      setOffset(ifRightParenToken, 0, ifLeftParenToken)
      processMaybeBlock(node.consequent)

      if (node.alternate != null) {
        const elseToken = template.getTokenAfter(node.consequent, isNotRightParen)

        setOffset(elseToken, 0, ifToken)
        processMaybeBlock(node.alternate)
      }
    },

    LabeledStatement (node) {
      const labelToken = template.getFirstToken(node)
      const colonToken = template.getTokenAfter(labelToken)
      const bodyToken = template.getTokenAfter(colonToken)

      setOffset(colonToken, 1, labelToken)
      setOffset(bodyToken, 1, colonToken)
    },

    'MemberExpression, MetaProperty' (node) {
      processParentheses(node)

      const objectToken = template.getFirstToken(node)
      if (node.computed) {
        const leftBracketToken = template.getTokenBefore(node.property, isLeftBracket)
        const propertyToken = template.getTokenAfter(leftBracketToken)
        const rightBracketToken = template.getTokenAfter(node.property, isRightBracket)

        setOffset(leftBracketToken, 1, objectToken)
        setOffset(propertyToken, 1, leftBracketToken)
        setOffset(rightBracketToken, 0, leftBracketToken)
      } else {
        const dotToken = template.getTokenBefore(node.property)
        const propertyToken = template.getTokenAfter(dotToken)

        setOffset(dotToken, 1, objectToken)
        setOffset(propertyToken, 1, dotToken)
      }
    },

    'MethodDefinition, Property' (node) {
      const isMethod = (node.type === 'MethodDefinition' || node.method === true)
      const prefixTokens = getPrefixTokens(node)
      const hasPrefix = prefixTokens.length >= 1

      for (let i = 1; i < prefixTokens.length; ++i) {
        setOffset(prefixTokens[i], 1, prefixTokens[i - 1])
      }

      let lastKeyToken = null
      if (node.computed) {
        const keyLeftToken = template.getFirstToken(node, isLeftBracket)
        const keyToken = template.getTokenAfter(keyLeftToken)
        const keyRightToken = lastKeyToken = template.getTokenAfter(node.key, isRightBracket)

        if (hasPrefix) {
          setOffset(keyLeftToken, 1, last(prefixTokens))
        }
        setOffset(keyToken, 1, keyLeftToken)
        setOffset(keyRightToken, 0, keyLeftToken)
      } else {
        const idToken = lastKeyToken = template.getFirstToken(node.key)

        if (hasPrefix) {
          setOffset(idToken, 1, last(prefixTokens))
        }
      }

      if (isMethod) {
        const leftParenToken = template.getTokenAfter(lastKeyToken)

        setOffset(leftParenToken, 1, lastKeyToken)
      } else {
        const colonToken = template.getTokenAfter(lastKeyToken)
        const valueToken = template.getTokenAfter(colonToken)

        setOffset(colonToken, 1, lastKeyToken)
        setOffset(valueToken, 1, colonToken)
      }
    },

    NewExpression (node) {
      processParentheses(node)

      const newToken = template.getFirstToken(node)
      const calleeToken = template.getTokenAfter(newToken)
      const rightToken = template.getLastToken(node)
      const leftToken = isRightParen(rightToken)
        ? template.getFirstTokenBetween(node.callee, rightToken, isLeftParen)
        : null

      setOffset(calleeToken, 1, newToken)
      if (leftToken != null) {
        setOffset(leftToken, 1, calleeToken)
        processNodeList(node.arguments, leftToken, rightToken, 1)
      }
    },

    SequenceExpression (node) {
      processParentheses(node)

      const headToken = getChainHeadToken(node)
      const tokens = []

      for (let i = 1; i < node.expressions.length; ++i) {
        const node = node.expressions[i]
        const commaToken = template.getTokenBefore(node, isNotLeftParen)
        const expressionToken = template.getTokenAfter(commaToken)

        tokens.push(commaToken, expressionToken)
      }

      setOffset(tokens, 1, headToken)
    },

    SwitchCase (node) {
      const caseToken = template.getFirstToken(node)

      if (node.test != null) {
        const testToken = template.getTokenAfter(caseToken)
        const colonToken = template.getTokenAfter(node.test, isNotRightParen)

        setOffset(testToken, 1, caseToken)
        setOffset(colonToken, 1, testToken)
      } else {
        const colonToken = template.getTokenAfter(caseToken)

        setOffset(colonToken, 1, caseToken)
      }
    },

    SwitchStatement (node) {
      const switchToken = template.getFirstToken(node)
      const leftParenToken = template.getTokenAfter(switchToken)
      const discriminantToken = template.getTokenAfter(leftParenToken)
      const leftBraceToken = template.getTokenAfter(node.discriminant, isLeftBrace)
      const rightParenToken = template.getTokenBefore(leftBraceToken)
      const rightBraceToken = template.getLastToken(node)

      setOffset(leftParenToken, 1, switchToken)
      setOffset(discriminantToken, 1, leftParenToken)
      setOffset(rightParenToken, 0, leftParenToken)
      setOffset(leftBraceToken, 0, switchToken)
      setOffset(node.cases.map(n => template.getFirstToken(n)), 1, leftBraceToken)
      setOffset(rightBraceToken, 0, leftBraceToken)
    },

    TaggedTemplateExpression (node) {
      processParentheses(node)

      const tagToken = template.getFirstToken(node)
      const quasiToken = template.getTokenAfter(node.tag, isNotRightParen)

      setOffset(quasiToken, 1, tagToken)
    },

    TemplateLiteral (node) {
      processParentheses(node)

      const firstToken = template.getFirstToken(node)
      const quasiTokens = node.quasis.slice(1).map(n => template.getFirstToken(n))
      const expressionToken = node.quasis.slice(0, -1).map(n => template.getTokenAfter(n))

      setOffset(quasiTokens, 0, firstToken)
      setOffset(expressionToken, 1, firstToken)
    },

    TryStatement (node) {
      const tryToken = template.getFirstToken(node)
      const tryBlockToken = template.getFirstToken(node.block)

      setOffset(tryBlockToken, 0, tryToken)

      if (node.handler != null) {
        const catchToken = template.getFirstToken(node.handler)

        setOffset(catchToken, 0, tryToken)
      }

      if (node.finalizer != null) {
        const finallyToken = template.getTokenBefore(node.finalizer)
        const finallyBlockToken = template.getFirstToken(node.finalizer)

        setOffset([finallyToken, finallyBlockToken], 0, tryToken)
      }
    },

    VariableDeclaration (node) {
      processSemicolon(node)
      processNodeList(node.declarations, template.getFirstToken(node), null, 1)
    },

    VariableDeclarator (node) {
      if (node.init != null) {
        const idToken = template.getFirstToken(node)
        const eqToken = template.getTokenAfter(node.id)
        const initToken = template.getTokenAfter(eqToken)

        setOffset(eqToken, 1, idToken)
        setOffset(initToken, 1, eqToken)
      }
    },

    'WhileStatement, WithStatement' (node) {
      const firstToken = template.getFirstToken(node)
      const leftParenToken = template.getTokenAfter(firstToken)
      const rightParenToken = template.getTokenBefore(node.consequent, isRightParen)

      setOffset(leftParenToken, 1, firstToken)
      setOffset(rightParenToken, 0, leftParenToken)
      processMaybeBlock(node.body)
    },

    // Ignore tokens of unknown nodes.
    '*:exit' (node) {
      if (!KNOWN_NODES.has(node.type)) {
        for (const token of template.getTokens(node)) {
          offsets.delete(token)
        }
      }
    },

    // Do validation.
    "VElement[parent.type='VDocumentFragment']:exit" (node) {
      const indents = []
      let comments = []
      let tokensOnSameLine = []

      // Set the base indent.
      indents[node.loc.start.line] = 0
      setOffset(template.getFirstToken(node), 0, template.getFirstToken(node))

      // Validate indentations of tokens.
      for (const token of template.getTokens(node, { includeComments: true, filter: isNotWhitespace })) {
        {
          const offsetInfo = offsets.get(token)
          if (offsetInfo == null) {
            console.log(JSON.stringify(sourceCode.getText(token)), 'is unknown.')
          } else if (offsetInfo.offset === 0) {
            console.log(JSON.stringify(sourceCode.getText(token)), 'is the same as', JSON.stringify(sourceCode.getText(offsetInfo.baseToken)))
          } else {
            console.log(JSON.stringify(sourceCode.getText(token)), 'is', offsetInfo.offset, 'offset from', JSON.stringify(sourceCode.getText(offsetInfo.baseToken)))
          }
        }

        if (tokensOnSameLine.length === 0 || last(tokensOnSameLine).loc.start.line === token.loc.start.line) {
          tokensOnSameLine.push(token)
        } else if (tokensOnSameLine.every(isComment)) {
          Array.prototype.push.apply(comments, tokensOnSameLine) // push all.
          tokensOnSameLine = [token]
        } else {
          validate(tokensOnSameLine, comments, indents)
          tokensOnSameLine = [token]
          comments = []
        }
      }
      if (tokensOnSameLine.length >= 1 && tokensOnSameLine.some(isNotComment)) {
        validate(tokensOnSameLine, [], indents)
      }
    }
  })

  return {}
}

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

module.exports = {
  create,
  meta: {
    docs: {
      description: 'enforce consistent indentation in `<template>`.',
      category: 'Stylistic Issues',
      recommended: false
    },
    fixable: null,
    schema: [
      {
        anyOf: [
          { type: 'integer', minimum: 1 },
          { enum: ['tab'] }
        ]
      },
      {
        type: 'object',
        properties: {
          'attribute': { type: 'integer', minimum: 0 },
          'closeBracket': { type: 'integer', minimum: 0 }
        },
        additionalProperties: false
      }
    ]
  }
}
