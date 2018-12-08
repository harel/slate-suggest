import SuggestPlugin from '../lib';
import React from 'react';
import ReactDOM from 'react-dom';
import initialState from './state.json';
import { Editor } from 'slate-react';
import { Value } from 'slate';
import {SuggestionsContext} from '../lib/context';
import Tags from './tags.json';


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
    console.log("updatestate with", state, callback)
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
    updateSuggestions: this.setSuggestions
  };

  onChange = ({value}) => {
    console.log("TOP ON CHANGE VALUE", value)
    this.setState({ value })
  }

  /**
   * Perform a search/fetch or filtering of tags based on query value
   * @param  {string} query
   */
  search = (query) => {
    const suggestions = query ? Tags.filter((item) => item.key.startsWith(query)) : Tags;
    this.setState({
      results: suggestions
    })
  }

  render = () => {
    const {value} = this.state;
    return (
      <div>
        <SuggestionsContext.Provider value={this.state}>
          <Editor
            spellCheck
            autoFocus
            ref={this.editorRef}
            plugins={this.plugins}
            value={value}
            onChange={this.onChange}
          />
        </SuggestionsContext.Provider>
      </div>
    )
  }
}

const example = <Example />
const root = document.body.querySelector('main')
ReactDOM.render(example, root)