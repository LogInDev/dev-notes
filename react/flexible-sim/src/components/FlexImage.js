// src/components/FlexImage.js
import React, { Component } from "react";

class FlexImage extends Component {
    render() {
        const {
            url,
            size = "full",
            aspectRatio = "16:9",
            margin,
            borderRadius = 8,
            alt = "",
            style = {},
        } = this.props;

        // aspectRatio 계산
        const [w, h] = aspectRatio.split(":").map(Number);
        const ratio = (h / w) * 100;

        return (
            <div style={{
                width: "100%",
                position: "relative",
                paddingTop: `${ratio}%`,
                background: "#eee",
                margin,
                borderRadius,
                overflow: "hidden",
                ...style,
            }}>
                <img
                    src={url}
                    alt={alt}
                    style={{
                        position: "absolute",
                        left: 0, top: 0, width: "100%", height: "100%",
                        objectFit: "cover"
                    }}
                />
            </div>
        );
    }
}

export default FlexImage;
