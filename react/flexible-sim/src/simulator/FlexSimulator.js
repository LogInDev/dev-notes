// src/FlexSimulator.js
import React, { Component } from "react";
import FlexibleRenderer from "../components/flex_message_template/FlexibleRenderer";
import EX1, {imgBot, resevation} from "../requestSample";

const SAMPLE_JSON = imgBot;

class FlexSimulator extends Component {
    state = { json: SAMPLE_JSON, data: JSON.parse(SAMPLE_JSON), error: null };

    handleChange = (e) => {
        const json = e.target.value;
        try {
            const data = JSON.parse(json);
            this.setState({ json, data, error: null });
        } catch (error) {
            this.setState({ json, data: null, error: error.message });
        }
    };

    render() {
        const { json, data, error } = this.state;
        return (
            <div style={{ display: "flex", height: "100vh", background: "#f3f4f6" }}>
        <textarea
            value={json}
            onChange={this.handleChange}
            style={{
                width: 420,
                fontSize: 15,
                padding: 16,
                border: "none",
                outline: "none",
                background: "#fff",
                boxShadow: "2px 0 8px #0001",
                resize: "none"
            }}
        />
                <div style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f3f4f6"
                }}>
                    <div>
                        {error && <div style={{ color: "red", fontWeight: 600 }}>{error}</div>}
                        {data && <FlexibleRenderer data={data} />}
                    </div>
                </div>
            </div>
        );
    }
}

export default FlexSimulator;
