// src/components/FlexBubble.js
import React, { Component } from "react";

class FlexBubble extends Component {
    render() {
        const { header, hero, body, footer, styles, renderElement } = this.props;
        return (
            <div
                style={{
                    border: "1px solid #d1d5db",
                    borderRadius: 12,
                    background: "#fff",
                    margin: "16px 0",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px #0001",
                    ...((styles && styles.body && styles.body.backgroundColor)
                        ? { background: styles.body.backgroundColor }
                        : {})
                }}
            >
                {header && <div style={{ padding: 16 }}>{renderElement(header, "header")}</div>}
                {hero && <div>{renderElement(hero, "hero")}</div>}
                {body && <div style={{ padding: 16 }}>{renderElement(body, "body")}</div>}
                {footer && (
                    <div style={{
                        borderTop: "1px solid #eee",
                        padding: 12,
                        background: "#fafbfc"
                    }}>
                        {renderElement(footer, "footer")}
                    </div>
                )}
            </div>
        );
    }
}

export default FlexBubble;
