// src/components/FlexCarousel.js
import React, { Component } from "react";

class FlexCarousel extends Component {
    state = { idx: 0 };
    render() {
        const { contents = [], renderElement } = this.props;
        const { idx } = this.state;

        if (!contents.length) return null;

        return (
            <div>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <button
                        onClick={() => this.setState({ idx: Math.max(idx - 1, 0) })}
                        disabled={idx === 0}
                        style={{
                            border: "none",
                            background: "#f3f4f6",
                            padding: 6,
                            borderRadius: "50%",
                            marginRight: 8,
                            cursor: idx === 0 ? "not-allowed" : "pointer"
                        }}
                    >{"‹"}</button>
                    <div style={{ flex: 1 }}>
                        {renderElement(contents[idx], idx)}
                    </div>
                    <button
                        onClick={() => this.setState({ idx: Math.min(idx + 1, contents.length - 1) })}
                        disabled={idx === contents.length - 1}
                        style={{
                            border: "none",
                            background: "#f3f4f6",
                            padding: 6,
                            borderRadius: "50%",
                            marginLeft: 8,
                            cursor: idx === contents.length - 1 ? "not-allowed" : "pointer"
                        }}
                    >{"›"}</button>
                </div>
                <div style={{ textAlign: "center", fontSize: 12, marginTop: 8 }}>
                    {idx + 1} / {contents.length}
                </div>
            </div>
        );
    }
}
export default FlexCarousel;
