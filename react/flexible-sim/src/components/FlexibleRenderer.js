// src/components/FlexibleRenderer.js
import React, { Component } from "react";
import FlexBubble from "./FlexBubble";
import FlexBox from "./FlexBox";
import FlexText from "./FlexText";
import FlexButton from "./FlexButton";
import FlexImage from "./FlexImage";
import FlexCarousel from "./FlexCarousel";

const COMPONENT_MAP = {
    bubble: FlexBubble,
    box: FlexBox,
    text: FlexText,
    button: FlexButton,
    image: FlexImage,
    carousel: FlexCarousel,
};

class FlexibleRenderer extends Component {
    renderElement = (node, key) => {
        if (!node || !node.type) return null;
        const Comp = COMPONENT_MAP[node.type];
        if (!Comp) return null;
        return (
            <Comp key={key} {...node} renderElement={this.renderElement} />
        );
    };

    render() {
        const { data } = this.props;
        return (
            <div style={{ fontFamily: "sans-serif", width: 400 }}>
                {this.renderElement(data)}
            </div>
        );
    }
}

export default FlexibleRenderer;
