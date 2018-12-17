import SuggestPlugin from '../lib';
import React from 'react';
import ReactDOM from 'react-dom';
import initialState from './state.json';
import { Editor } from 'slate-react';
import { Value } from 'slate';
import {SuggestionsContext} from '../lib/context';
import Tags from './tags.json';


class Example extends React.Component {

    constructor(props) {
        super(props);
        this.lastInputValue = undefined;
        this.editorRef = React.createRef();

        // set up the plugin
        this.suggestPlugin = SuggestPlugin({
            context: SuggestionsContext,
            editorRef: this.editorRef,
            // The symbol or sequence that triggers the suggestion portal
            triggerSymbol: '@',
            // The full regex of what qualifies a suggestion lookup
            triggerRegEx: /@(\S*)$/,
            // handle requests to search for suggestion values
            onSearch: (editor, query) => {
                return this.search(query);
            },
            // handle change events within the plugin, accepting  new state and an optional callback
            onChange: (state, callback) => {
                this.setState(state, callback);
            },
            onNavigate: (direction, selected) => {
                let activeIndex = this.state.activeIndex + direction;
                if (activeIndex < 0) {
                    activeIndex = 0;
                } else if (activeIndex >= this.state.results.length) {
                    activeIndex = this.state.results.length - 1;
                }
                if (!selected) {
                  this.setState({
                      activeIndex
                  })
                } else {
                  this.editorRef.current.insertTag(this.state.results[activeIndex]);
                }
            }
        })

        this.plugins = [
            this.suggestPlugin
        ]
	}

    state = {
        value: Value.fromJSON(initialState),
        results: Tags,
        activeIndex: -1,
        selected: false,
    };

    onChange = ({value}) => {
        this.setState({ value })
    }

    /**
     * Perform a search/fetch or filtering of tags based on query value
     * @param  {string} query
     */
    search = (query) => {
        setTimeout(() => {
            const suggestions = query ? Tags.filter((item) => item.key.toUpperCase().startsWith(query.toUpperCase())) : Tags;
            console.log("SUGGESTIONS: ", suggestions)
            this.setState({
                results: suggestions
            })
        }, 50);
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