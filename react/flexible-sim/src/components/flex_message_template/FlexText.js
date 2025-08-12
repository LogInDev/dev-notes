// src/components/FlexText.js
import React, { Component } from "react";

class FlexText extends Component {
    render() {
        const {
            text,
            size = "md",
            weight,
            color = "#222",
            align = "left",
            wrap = true,
            margin,
            style = {}
        } = this.props;

        const fontSize =
            size === "lg" ? 18 :
                size === "sm" ? 12 :
                    size === "xl" ? 22 :
                        15;

        const fontWeight =
            weight === "bold" ? 700 :
                weight === "light" ? 300 :
                    400;

        return (
            <div
                style={{
                    fontSize,
                    fontWeight,
                    color,
                    textAlign: align,
                    margin,
                    whiteSpace: wrap ? "pre-line" : "nowrap",
                    wordBreak: "break-all",
                    ...style,
                }}
            >
                {text}
            </div>
        );
    }
}

export default FlexText;
