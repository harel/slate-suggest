import React from 'react';
import Portal from './portal';
import styled from '@emotion/styled'
import {
    CONTEXT_MARK_CLASS,
    DEFAULT_SELECTOR_POS
} from './constants';


const SuggestionList = styled.ul(
    {
        background: '#fff',
        listStyle: 'none',
        margin: 0,
        padding: 0,
        position: 'absolute'
    },
    // props => ({
    //     display: props.active ? 'inline' : 'hidden'
    // })
)

const Suggestion = styled.li(
    {
        alignItems: 'center',
        borderLeft: '1px solid #ddd',
        borderRight: '1px solid #ddd',
        borderTop: '1px solid #ddd',
        display: 'flex',
        height: 32,
        padding: '4px 8px',
        '&:hover': {
            background: '#87cefa'
        },
        '&:lastOfType': {
            borderBottom: '1px solid #ddd'
        }
    },
    props => ({
        background: props.active ? 'red' : ''
    })
)

class Suggestions extends React.Component {
    selectorRef = React.createRef()


    xstate = {
        // activeIndex: this.props.activeIndex,
        ...DEFAULT_SELECTOR_POS
    }

    xcomponentDidMount = () => {
        this.updateSelector()
    }

    xcomponentDidUpdate = () => {
        console.log("UPDATED")
        this.updateSelector()
    }

    xcomponentWillReceiveProps = (nextProps) => {
        console.log("NEXTPROPS", nextProps)
        if (nextProps.activeIndex !== this.state.activeIndex) {
            this.setState({activeIndex}, () => {
                this.updateSelector()
            })
        }
        this.updateSelector()
    } 

    updateSelector = () => {
        const anchor = window.document.querySelector(`.${CONTEXT_MARK_CLASS}`);
        if (!anchor) {
            return this.setState(DEFAULT_SELECTOR_POS)
        }
        const anchorRect = anchor.getBoundingClientRect();
        this.setState({
            top: anchorRect.bottom,
            left: anchorRect.left
        })
    }

    render() {
        const {options, editor, position, activeIndex} = this.props;
        // const {top, left} = this.state;
        const anchor = window.document.querySelector(`.${CONTEXT_MARK_CLASS}`);
        console.log('activeIndex', activeIndex)
        return (
            <Portal>
                <SuggestionList
                    ref={this.selectorRef}
                    style={position}
                >
                {options.map((item, index) => {
                    return (
                        <Suggestion
                            key={index}
                            active={index === activeIndex}
                            onClick={() => editor.insertTag(item)}
                        >
                            {item.key}
                        </Suggestion>
                    )
                })}
                </SuggestionList>
            </Portal>
        )
    }

}

export default Suggestions;