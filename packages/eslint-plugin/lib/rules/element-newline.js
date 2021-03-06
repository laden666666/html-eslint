/**
 * @typedef {import("../types").HTMLNode} HTMLNode
 */

const { RULE_CATEGORY, NODE_TYPES } = require("../constants");

const MESSAGE_IDS = {
  EXPECT_NEW_LINE_AFTER: "expectAfter",
  EXPECT_NEW_LINE_BEFORE: "expectBefore",
};

module.exports = {
  meta: {
    type: "code",

    docs: {
      description: "Enforce newline between elements.",
      category: RULE_CATEGORY.STYLE,
      recommended: true,
    },

    fixable: true,
    schema: [],
    messages: {
      [MESSAGE_IDS.EXPECT_NEW_LINE_AFTER]:
        "There should be a linebreak after {{tag}}.",
      [MESSAGE_IDS.EXPECT_NEW_LINE_BEFORE]:
        "There should be a linebreak before {{tag}}.",
    },
  },

  create(context) {
    function checkSiblings(sibilings) {
      sibilings
        .filter((node) => node.type !== NODE_TYPES.TEXT && node.range[0])
        .forEach((current, index, arr) => {
          const after = arr[index + 1];
          if (after) {
            if (isOnTheSameLine(current, after)) {
              context.report({
                node: current,
                messageId: MESSAGE_IDS.EXPECT_NEW_LINE_AFTER,
                data: { tag: `<${current.tagName}>` },
                fix(fixer) {
                  return fixer.insertTextAfter(current, "\n");
                },
              });
            }
          }
        });
    }

    function checkChild(node) {
      const children = (node.childNodes || []).filter(
        (n) => !!n.range[0] && n.type !== NODE_TYPES.TEXT
      );
      const first = children[0];
      const last = children[children.length - 1];
      if (first) {
        if (isOnTheSameLine(node.startTag, first)) {
          context.report({
            node: node.startTag,
            messageId: MESSAGE_IDS.EXPECT_NEW_LINE_AFTER,
            data: { tag: `<${node.tagName}>` },
            fix(fixer) {
              return fixer.insertTextAfter(node.startTag, "\n");
            },
          });
        }
      }
      if (last) {
        if (isOnTheSameLine(node.endTag, last)) {
          context.report({
            node: node.endTag,
            messageId: MESSAGE_IDS.EXPECT_NEW_LINE_BEFORE,
            data: { tag: `</${node.tagName}>` },
            fix(fixer) {
              return fixer.insertTextBefore(node.endTag, "\n");
            },
          });
        }
      }
    }
    return {
      "*"(node) {
        if (node.type !== NODE_TYPES.TEXT) {
          checkSiblings(node.childNodes || []);
          checkChild(node);
        }
      },
    };
  },
};

/**
 * Checks whether two nodes are on the same line or not.
 * @param {HTMLNode} nodeBefore A node before
 * @param {HTMLNode} nodeAfter  A node after
 * @returns {boolean} `true` if two nodes are on the same line, otherwise `false`.
 */
function isOnTheSameLine(nodeBefore, nodeAfter) {
  if (nodeBefore && nodeAfter) {
    if (nodeBefore.endTag) {
      return nodeBefore.endTag.loc.end.line === nodeAfter.loc.start.line;
    }
    return nodeBefore.loc.start.line === nodeAfter.loc.start.line;
  }
  return false;
}
