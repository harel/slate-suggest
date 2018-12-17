import React from 'react';
import Suggestions from './suggestions';
import {SuggestionsContext} from './context';
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


/**
 * Suggest plugin accepts a list of possible suggestions to present
 * when a sequence is entered.
 * @param {object} options
 */
export default function SuggestPlugin(params) {
    let { 
        triggerSymbol,
        triggerRegEx, 
        onSearch, 
        onChange,
        editorRef, 
        onNavigate,
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

        queries: {
            hasSuggestionMark: (editor) => {
                const hasMark = editor.value.activeMarks.some(mark => mark.type == CONTEXT_MARK_TYPE)
                console.log(">>>>>>>>>>...plugin has mark", hasMark, editor.value.activeMarks)
                return hasMark;
            },
        },

        commands: {
            searchSuggestions: onSearch,
            // insert the actual tag into the editor
            insertTag: (editor, tag) => {
                console.log("insertTag", editor, tag)
                const value = editor.value
                const inputValue = getInput(value, triggerRegEx) 
                if (!inputValue) {
                    return null;
                }

                // Delete the captured value, including the trigger symbol
                editor.deleteBackward(inputValue.length + triggerSymbol.length)

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
            }
        },


        /**
         * Render the children add the suggestions box, passing the context to it
         */
        renderEditor(props, editor, next) {
            const children = next();
            const suggestPos = getMarkBoundingRect(CONTEXT_MARK_CLASS, DEFAULT_SELECTOR_POS);            
            return (
                <React.Fragment>
                    <React.Fragment>{children}</React.Fragment>
                    <SuggestionsContext.Consumer>
                        {({results, activeIndex}) => {
                            editor.resultSize = results.length;
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
            const inputValue = getInput(value, triggerRegEx);
            console.log('inputValue', inputValue);
            if (inputValue !== editorRef.current.lastInputValue) {
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
                onChange({ value }, () => {
                    editorRef.current.setDecorations(decorations)
                });
                return;
            }
            onChange({ value });
            return next();
          },

        // alternate approach using onKeydown
        onKeyDown(event, editor, next) {
            const node = editor.value.blocks.first(); 
            const hasMark = editor.hasSuggestionMark();
            if (editor.value.selection.isFocused && editorRef.current) { 
                if (event.keyCode === UP_ARROW_KEY || event.keyCode === DOWN_ARROW_KEY) {
                    event.preventDefault();
                    const resultSize = isNaN(editor.resultSize) ? 0 : editor.resultSize;
                    let activeIndex = isNaN(editor.activeIndex) ? -1 : editor.activeIndex;
                    console.log("ACTIVE INDEX", activeIndex)
                    const direction = event.keyCode === UP_ARROW_KEY ? -1 : 1;
                    onNavigate(direction);
                    // if (event.keyCode === UP_ARROW_KEY) {
                    //     if (activeIndex - 1 < 0) {
                    //         activeIndex = 0;
                    //     } else {
                    //         activeIndex--;
                    //     }
                    // } else if (event.keyCode === DOWN_ARROW_KEY) {
                    //     if (activeIndex < 0) {
                    //         activeIndex = 0;
                    //     } else if (activeIndex + 1 >= resultSize) {
                    //         activeIndex = resultSize - 1;
                    //     } else {
                    //         activeIndex++;
                    //     }
                    // }
                    // editor.activeIndex = activeIndex; 
                    // console.log("UP/DOWN ARROWS", activeIndex)
                    // onChange({
                    //     activeIndex: activeIndex
                    // })
                } else if (event.keyCode === ENTER_KEY) {
                    event.preventDefault();
                    console.log("ENTER", node.text );
                    editor.insertTag(node.text);
                }
            }
            return next()
        }
    }
}