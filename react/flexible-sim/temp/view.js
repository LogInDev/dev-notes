import React, { Component } from 'react';
import { connect } from 'react-redux';
import { sendAIQuery } from '../actions/ai';

class AssistantView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      input: '',
    };
  }

  handleInputChange = (e) => {
    this.setState({ input: e.target.value });
  };

  handleSubmit = () => {
    const { input } = this.state;
    const { threadId, dispatch } = this.props;

    if (input.trim() !== '') {
      dispatch(sendAIQuery({ query: input, threadId }));
      this.setState({ input: '' });
    }
  };

  render() {
    const { input } = this.state;
    const { messages, loading } = this.props;

    return (
      <div className="assistant-view">
        <div className="message-list">
          {messages.map((msg, idx) => (
            <div key={idx} className="message-item">
              <strong>AI:</strong> {msg.text}
            </div>
          ))}
          {loading && <div>Loading...</div>}
        </div>
        <div className="input-area">
          <input
            type="text"
            value={input}
            onChange={this.handleInputChange}
            placeholder="Ask something..."
          />
          <button onClick={this.handleSubmit}>Send</button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  messages: state.ai.messages,
  threadId: state.ai.threadId,
  loading: state.ai.loading,
});

export default connect(mapStateToProps)(AssistantView);