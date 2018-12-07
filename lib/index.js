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
} from './constants';
import {
    getInput,
    hasValidAncestors,
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
        updateState
    } = params;
    let lastInputValue = undefined;

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
                            text: `@${tag.value}`,
                          },
                        ],
                      },
                    ],
                    type: SUGGEST_NODE_TYPE,
                  })
                  .focus()
            }

        },



        renderEditor(props, editor, next) {
            const children = next()
            return (
                <React.Fragment>
                    <React.Fragment>{children}</React.Fragment>
                    <SuggestionsContext.Consumer>
                        {({results, updateSuggestions}) => {
                            return (
                                <Suggestions
                                    anchor={CONTEXT_MARK_CLASS}
                                    options={results}
                                    editor={editor}
                                />
                            )
                        }}
                    </SuggestionsContext.Consumer>
                </React.Fragment>
            )

        },

        renderNode(props, editor, next) {
            const { attributes, node } = props
            // console.log("render Node", node, props)

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
                    <span {...props.attributes} className={CONTEXT_MARK_CLASS} style={{color: 'red'}}>
                        [[{props.children}]]
                    </span>
                )
            }
            return next();
        },

        onChange(editor, next) {
            const inputValue = getInput(editor.value, capture)
            console.log("INPUT VALUE", capture, inputValue, "/", lastInputValue, ':', inputValue == lastInputValue)
            if (inputValue !== lastInputValue) {
                lastInputValue = inputValue
                const _hasValidAncestor = hasValidAncestors(editor.value);
                console.log("valid ancestor", _hasValidAncestor)
                if (_hasValidAncestor) {
                    editor.searchSuggestions(inputValue);
                }

                const { selection } = editor.value;
                let decorations = editor.value.decorations.filter(
                    value => value.mark.type !== CONTEXT_MARK_TYPE
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
                editor.setDecorations(decorations);
                // updateState({ value: editor.value }, () => {
                //     // We need to set decorations after the value flushes into the editor.
                //    editor.setDecorations(decorations)
                // })
                return next();
            }
            // state or next???
            // updateState({ value: editor.value });
            return next();
          },

        // alternate approach using onKeydown
        _onKeyDown(event, editor, next) {
            console.log('Suggest->keydown: ', event.key, trigger)
            const node = editor.value.blocks.first();
            const nodeText = node.text + event.key;
            console.log("NODE", nodeText);
            if (editor.value.selection.isFocused && capture.test(nodeText)) {
                if (event.key === trigger) {
                    console.log("TOGGLE @")
                    const input = getInput(editor.value, capture);
                    console.log("INPUT==", input)
                    let decorations = editor.value.decorations.filter(
                        value => value.mark.type !== CONTEXT_MARK_TYPE
                    )
                    console.log("DECORATIONS", decorations)
                    editor.toggleMark(CONTEXT_MARK_TYPE);
                    const {options} = editor.searchSuggestions(input)
                    const hasMark = editor.hasMark(CONTEXT_MARK_TYPE);
                    console.log("SEARCH RESULT", options)
                    return true;
                } else if ((event.keyCode === UP_ARROW_KEY || event.keyCode === DOWN_ARROW_KEY)) {
                    event.preventDefault();
                    console.log("UP/DOWN ARROWS")
                } else if (event.keyCode === ENTER_KEY) {
                    event.preventDefault()
                    console.log("ENTER");
                    editor.toggleMark(CONTEXT_MARK_TYPE);
                } else if (onKeyDown) {
                    onKeyDown(event);
                }
            }
            return next()
        }
    }
}