import SuggestPlugin from '../lib';
import React from 'react';
import ReactDOM from 'react-dom';
import initialState from './state.json';
import { Editor } from 'slate-react';
import { Value } from 'slate';
import {SuggestionsContext} from '../lib/context';
import Tags from './tags.json';
import {DEFAULT_SELECTOR_POS, CONTEXT_MARK_CLASS, CONTEXT_MARK_TYPE, SUGGEST_NODE_TYPE} from '../lib/constants';
import {
    getInput,
    hasValidAncestors,
    getMarkBoundingRect,
} from '../lib/utils';
import Suggestions from '../lib/suggestions';
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCurrentWord(text, index, initialIndex) {
  if (index === initialIndex) {
    return { start: getCurrentWord(text, index - 1, initialIndex), end: getCurrentWord(text, index + 1, initialIndex) }
  }
  if (text[index] === " " || text[index] === "@" || text[index] === undefined) {
    return index
  }
  if (index < initialIndex) {
    return getCurrentWord(text, index - 1, initialIndex)
  }
  if (index > initialIndex) {
    return getCurrentWord(text, index + 1, initialIndex)
  }
}

const testPI = {
  onChange: ({value}) => {
    console.log("TESTPI",value)
  }
}

class Example extends React.Component {

  constructor(props) {
    super(props);
    this.lastInputValue = undefined;
    this.editorRef = React.createRef();
    this.suggestPlugin = SuggestPlugin({
      context: SuggestionsContext,
      trigger: '@',
      capture: /@(\S*)$/,
      options: props.options,
      onSearch: (editor, query) => {
        const suggestions = this.search(query);
        return suggestions;
      },
      updateState: this.updateState,
      editorRef: this.editorRef,
    })

    this.plugins = [
      // testPI,
      this.suggestPlugin
    ]
  }


  updateState = (state, callback) => {
    this.setState(state, callback);
  }

  setSuggestions = (results) => {
    this.setState({
      results: results
    })
  }

  state = {
    value: Value.fromJSON(initialState),
    results: Tags,
    updateSuggestions: this.setSuggestions,
    activeIndex: 1,
  };

  xonChange = ({value}) => {
    this.setState({ value })
  }

  renderNode(props, editor, next) {
    const { attributes, node } = props
    if (node.type === SUGGEST_NODE_TYPE) {
        return <b {...attributes}>{props.node.text}</b>
    }
    return next()
}


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
}
onChange = ({value}) => {
  const capture = /@(\S*)$/;
  const inputValue = getInput(value, capture);

  if (inputValue !== this.lastInputValue) {
      console.log('inputValue', inputValue);
      this.lastInputValue = inputValue
      

      const { selection } = value;
      let decorations = value.decorations.filter(
          val => val.mark.type !== CONTEXT_MARK_TYPE
      )

      if (inputValue && hasValidAncestors(value)) {
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
      this.setState({ value }, () => {
          // We need to set decorations after the value flushes into the editor.
         this.editorRef.current.setDecorations(decorations);
         if (hasValidAncestors(value)) {
              this.search(inputValue);
          }
      })
      return
  }
  this.setState({ value }); 
}

  /**
   * Perform a search/fetch or filtering of tags based on query value
   * @param  {string} query
   */
  search = (query) => {
    setTimeout(()=>{
    const suggestions = query ? Tags.filter((item) => item.key.toUpperCase().startsWith(query.toUpperCase())) : Tags;
    this.setState({
      results: suggestions
    })
  }, 50);
  }

  render = () => {
    const {value} = this.state;
    const suggestPos = getMarkBoundingRect(CONTEXT_MARK_CLASS, DEFAULT_SELECTOR_POS);
console.log('state', suggestPos, this.state)
    return (
      <div>
         
          <Editor
            spellCheck
            autoFocus
            ref={this.editorRef}
            plugins={this.plugins}
            value={value}
            onChange={this.onChange} 
            renderMark={this.renderMark}
            renderNode={this.renderNode}
          />
          <Suggestions
              anchor={CONTEXT_MARK_CLASS}
              options={this.state.results}
              editor={this.editorRef}
              activeIndex={this.state.activeIndex}
              position={suggestPos}
          />
        
      </div>
    )
  }
}

const example = <Example />
const root = document.body.querySelector('main')
ReactDOM.render(example, root)