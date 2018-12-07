import React from 'react';
import ReactDom from 'react-dom';


class Portal extends React.Component {
    static defaultProps = {
        container: 'suggest'
    }

    constructor(props) {
        super(props);
        this.element = document.createElement('div');
    }

    componentDidMount() {
        const {container} = this.props;
        document.body.querySelector(container).appendChild(this.element);
    }

    componentWillUnmount() {
        const {container} = this.props;
        document.body.querySelector(container).removeChild(this.element);
    }

    render() {
        const {children} = this.props;
        return ReactDom.createPortal(children, this.element);
    }
}

export default Portal;