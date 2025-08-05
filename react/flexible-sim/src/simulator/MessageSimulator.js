import React, { Component } from 'react';
import FlexMessagePanel from '../components/FlexMessagePanel';
import requestSample from '../requestSample';

class MessageSimulator extends Component {
    constructor(props) {
        super(props);
        this.state = {
            input: JSON.stringify(requestSample, null, 2),
            parsed: requestSample,
            error: null
        };
    }

    handleInputChange = (e) => {
        this.setState({ input: e.target.value });
    };

    handlePreview = () => {
        try {
            const parsed = JSON.parse(this.state.input);
            this.setState({ parsed, error: null });
        } catch (err) {
            this.setState({ error: err.message });
        }
    };

    render() {
        const { input, parsed, error } = this.state;
        return (
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ width: 480, marginRight: 40 }}>
          <textarea
              style={{ width: '100%', height: 440, fontFamily: 'monospace', fontSize: 15, borderRadius: 8, border: '1px solid #ccc' }}
              value={input}
              onChange={this.handleInputChange}
          />
                    <button
                        onClick={this.handlePreview}
                        style={{ marginTop: 12, padding: '8px 28px', fontWeight: 700, borderRadius: 8, border: 0, background: '#1976d2', color: '#fff', fontSize: 16 }}
                    >PREVIEW</button>
                    {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
                </div>
                <div>
                    <FlexMessagePanel body={parsed} lang="ko" />
                </div>
            </div>
        );
    }
}

export default MessageSimulator;
