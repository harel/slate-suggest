import React from 'react';
import Suggestions from './suggestions';

import {
    UP_ARROW_KEY,
    DOWN_ARROW_KEY,
    ENTER_KEY,
    CONTEXT_MARK_TYPE,
    SUGGEST_NODE_TYPE,
    LOOKUP_KEY,
    CONTEXT_MARK_CLASS,
    DEFAULT_SELECTOR_POS,
} from './constants';
import {
    getInput,
    hasValidAncestors,
    getMarkBoundingRect,
} from './utils';
import {SuggestionsContext} from './context';

function matchTrigger(state, trigger) {
  const currentNode = state.blocks.first()

  return state.isFocused && trigger.test(currentNode.text)
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}




/**
 * Suggest plugin accepts a list of possible suggestions to present
 * when a certain key trigger (configurable) is entered.
 * @param {object} options
 */
export default function SuggestPlugin(params) {
    let {
        options,
        trigger,
        capture,
        onKeyDown,
        onSearch,
        suggestions,
        updateState,
        editorRef,
        setValueAndDecorate,
    } = params;

    return {
        schema: {
            inlines: {
                [SUGGEST_NODE_TYPE]: {
                  // It's important that we mark the mentions as void nodes so that users
                  // can't edit the text of the mention.
                  isVoid: true,
                },
            },
        },

        commands: {
            searchSuggestions: onSearch,
            hasMark: (editor, type) => {
                console.log("plugin has mark")
                return editor.value.activeMarks.some(mark => mark.type == type)
            },
            insertTag: (editor, tag) => {
                const value = editor.value
                const inputValue = getInput(value, capture)
                // const editor = this.editorRef.current
                if (!inputValue) {
                    return null;
                }

                // Delete the captured value, including the `@` symbol
                editor.deleteBackward(inputValue.length + 1)

                const selectedRange = editor.value.selection

                editor
                  .insertText(' ')
                  .insertInlineAtRange(selectedRange, {
                    data: {
                      ...tag
                    },
                    nodes: [
                      {
                        object: 'text',
                        leaves: [
                          {
                            text: `${tag.value}`,
                          },
                        ],
                      },
                    ],
                    type: SUGGEST_NODE_TYPE,
                  })
                  .focus()
            },

            evaluateSelectionIndex: (editor, currentIndex, key, maxResults) => {
                let _index = isNaN(currentIndex) ? 0 : currentIndex;
                if (key === UP_ARROW_KEY) {
                    _index--;
                    if (_index < 0) {
                        _index = 0;
                    }
                } else if (key === DOWN_ARROW_KEY) {
                    _index++;
                    if (_index >= maxResults) {
                        _index == maxResults-1;
                    }
                }
                return _index;
            }

        },



        crenderEditor(props, editor, next) {
            const children = next();
            const suggestPos = getMarkBoundingRect(CONTEXT_MARK_CLASS, DEFAULT_SELECTOR_POS);
            console.log("Render Editor: ", suggestPos)
            return (
                <React.Fragment>
                    <React.Fragment>{children}</React.Fragment>
                    <SuggestionsContext.Consumer>
                        {({results, updateSuggestions, activeIndex}) => {
                            return (
                                <Suggestions
                                    anchor={CONTEXT_MARK_CLASS}
                                    options={results}
                                    editor={editor}
                                    activeIndex={activeIndex}
                                    position={suggestPos}
                                />
                            )
                        }}
                    </SuggestionsContext.Consumer>
                </React.Fragment>
            )

        },

        renderNode(props, editor, next) {
            const { attributes, node } = props
            if (node.type === SUGGEST_NODE_TYPE) {
                return <b {...attributes}>{props.node.text}</b>
            }
            return next()
        },

        renderMark(props, editor, next) {
            const { children, mark, attributes } = props
            console.log("MARK RENDER", mark.type, attributes, children);
            if (mark.type === CONTEXT_MARK_TYPE) {
                return (
                    <span {...attributes} className={CONTEXT_MARK_CLASS} style={{color: 'red'}}>
                        {children}
                    </span>
                )
            }
            return next();
        },

        onChange({value}, next) {
            const inputValue = getInput(value, capture);
            if (inputValue !== editorRef.current.lastInputValue) {
                console.log('inputValue', inputValue);
                editorRef.current.lastInputValue = inputValue
                const _hasValidAncestor = hasValidAncestors(value);
                if (_hasValidAncestor) {
                    editorRef.current.searchSuggestions(inputValue);
                }

                const { selection } = value;
                let decorations = value.decorations.filter(
                    val => val.mark.type !== CONTEXT_MARK_TYPE
                )

                if (inputValue && _hasValidAncestor) {
                    decorations = decorations.push({
                        anchor: {
                            key: selection.start.key,
                            offset: selection.start.offset - inputValue.length,
                        },
                        focus: {
                            key: selection.start.key,
                            offset: selection.start.offset,
                        },
                        mark: {
                            type: CONTEXT_MARK_TYPE,
                        },
                    })
                }
                // should i set docrations or update state or both? is next needed?
                //editor.setDecorations(decorations);
                updateState({ value }, () => {
                    // We need to set decorations after the value flushes into the editor.
                   editorRef.current.setDecorations(decorations)
                })
                return next();
            }
            updateState({ value });
            return next();
          },

        // alternate approach using onKeydown
        onKeyDown(event, editor, next) {
            console.log('Suggest->keydown: ', event.key, trigger)
            const node = editor.value.blocks.first();
            const nodeText = node.text + event.key;
            console.log("NODE", nodeText);
            if (editor.value.selection.isFocused) { // && capture.test(nodeText)
                if ((event.keyCode === UP_ARROW_KEY || event.keyCode === DOWN_ARROW_KEY)) {
                    event.preventDefault();
                    console.log("UP/DOWN ARROWS")
                    updateState({
                        activeIndex: 1
                    })
                } else if (event.keyCode === ENTER_KEY) {
                    event.preventDefault()
                    console.log("ENTER");
                    editor.toggleMark(CONTEXT_MARK_TYPE);
                }
            }
            return next()
        }
    }
}