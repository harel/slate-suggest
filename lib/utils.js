export function getInput(value, regex) {
    // In some cases, like if the node that was selected gets deleted,
    // `startText` can be null.
    if (!value.startText) {
        return null
    }
    const startOffset = value.selection.start.offset
    const textBefore = value.startText.text.slice(0, startOffset)
    const result = regex.exec(textBefore)
    return result === null ? null : result[1]
}


/**
 * Determine if the current selection has valid ancestors for a context. In our
 * case, we want to make sure that the mention is only a direct child of a
 * paragraph. In this simple example it isn't that important, but in a complex
 * editor you wouldn't want it to be a child of another inline like a link.
 *
 * @param {Value} value
 */

export function hasValidAncestors(value) {
  const { document, selection } = value

  const invalidParent = document.getClosest(
    selection.start.key,
    // In this simple case, we only want mentions to live inside a paragraph.
    // This check can be adjusted for more complex rich text implementations.
    node => node.type !== 'paragraph'
  )

  return !invalidParent
}


export function getMarkBoundingRect(className, defaultValue) {
    const anchor = window.document.querySelector(`.${className}`);
    console.log("getMarkBoundingRect", anchor)
    if (!anchor) {
        return defaultValue;
    }
    const anchorRect = anchor.getBoundingClientRect();
    return {
        top: anchorRect.bottom,
        left: anchorRect.left
    }
}