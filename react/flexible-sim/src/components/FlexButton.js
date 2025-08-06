// src/components/FlexButton.js
import React, { Component } from "react";

class FlexButton extends Component {
    handleClick = () => {
        const { action } = this.props;
        if (action && action.uri) {
            window.open(action.uri, "_blank");
        } else if (action && action.label) {
            alert(`액션: ${action.label}`);
        }
        // 여기서 onAction 등 확장 가능
    };

    render() {
        const {
            style = "primary",
            color,
            margin,
            height = 36,
            action,
            text = "",
        } = this.props;

        let bg, fg;
        if (style === "primary") {
            bg = "#2563eb";
            fg = "#fff";
        } else if (style === "secondary") {
            bg = "#f3f4f6";
            fg = "#222";
        } else {
            bg = "#fff";
            fg = "#2563eb";
        }
        if (color) bg = color;

        return (
            <button
                style={{
                    display: "block",
                    width: "100%",
                    background: bg,
                    color: fg,
                    border: "none",
                    borderRadius: 6,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    margin,
                    height,
                    boxShadow: "0 1px 2px #0001",
                    transition: "background .2s",
                }}
                onClick={this.handleClick}
            >
                {action && action.label ? action.label : text}
            </button>
        );
    }
}

export default FlexButton;
