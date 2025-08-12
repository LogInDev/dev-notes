// src/components/FlexBox.js
import React, { Component } from "react";

class FlexBox extends Component {
    render() {
        const {
            layout,
            contents,
            spacing = "md",
            justifyContent,
            alignItems,
            flex = 0,
            margin,
            padding,
            renderElement,
            style = {}
        } = this.props;

        const direction = layout === "vertical" ? "column" : "row";
        const gap = spacing === "lg" ? 20 : spacing === "sm" ? 4 : 12;

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: direction,
                    gap,
                    flex,
                    justifyContent,
                    alignItems,
                    margin,
                    padding,
                    ...style,
                }}
            >
                {Array.isArray(contents) &&
                    contents.map((child, i) => renderElement(child, i))}
            </div>
        );
    }
}
export default FlexBox;
