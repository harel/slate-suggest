import React from 'react';
import Portal from './portal';
import {
    CONTEXT_MARK_CLASS,
    DEFAULT_SELECTOR_POS
} from './constants';

class Suggestions extends React.PureComponent {
    selectorRef = React.createRef()


    state = {
        activeIndex: null,
        ...DEFAULT_SELECTOR_POS
    }

    componentDidMount = () => {
        this.updateSelector()
    }

    componentDidUpdate = () => {
        this.updateSelector()
    }

    updateSelector = () => {
        const anchor = window.document.querySelector('.suggest-context');
        console.log("updateSelector", this.props.anchor, anchor)
        if (!anchor) {
            return this.setState(DEFAULT_SELECTOR_POS)
        }
        const anchorRect = anchor.getBoundingClientRect();
        console.log("UPEAT", anchorRect.botom, anchorRect.left)
        this.setState({
            top: anchorRect.bottom,
            left: anchorRect.left
        })
    }

    render() {
        const {options, editor} = this.props;
        const {top, left} = this.state;
        console.log(options, top, left)
        return (
            <Portal>
                <ul
                    ref={this.selectorRef}
                    style={{
                        position:'absolute',
                        top: top,
                        left: left,
                        color: 'blue'
                    }}
                >
                {options.map((item, index) => {
                    return (
                        <li key={index} onClick={() => editor.insertTag(item)}>{item.key}</li>
                    )
                })}
                </ul>
            </Portal>
        )
    }

}

export default Suggestions;