import React, { Component } from 'react';
import { connect } from 'react-redux';
import { aiExecuteQuery, aiSetLoading } from '../../store/actions';
import { selectThreadById } from '../../store/selectors';
import { ensureThreadListener } from '../../socket/aiListeners';

// props: { threadId, popupId, sock, apihandler }
class AIViewPopup extends Component {
    state = { input: '' };

    handleSend = () => {
        const text = (this.state.input || '').trim();
        if (!text) return;

        const { threadId, sock, apihandler } = this.props;
        const eb = sock && sock.eventbus;
        if (!apihandler || !eb) return;

        apihandler.aiSend({ text }, (reply) => {
            const respThreadId = reply?.body?.threadId || threadId;
            if (!respThreadId) {
                console.error('aiSend: threadId 없음');
                return;
            }
            ensureThreadListener(eb, respThreadId);

            this.props.dispatch(aiExecuteQuery({ threadId: respThreadId, text }));
            this.props.dispatch(aiSetLoading(respThreadId, true));
            this.setState({ input: '' });
        });
    };

    render() {
        const { threadId, thread } = this.props;
        const loading = !!(thread && thread.loading);

        return (
            <div className="ai-popup">
                <div className="ai-popup__header">
                    <strong>AI Assistant (Popup)</strong>
                    <span style={{ marginLeft: 8, opacity: 0.6 }}>{threadId || '(thread 없음)'}</span>
                </div>

                <div className="ai-popup__messages">
                    {(thread?.contents || []).map(m => (
                        <div key={m.messageId} className={`msg-row ${m.role}`}>
                            <div className="msg-author">{m.role === 'user' ? 'Me' : 'cubeChatBot'}</div>
                            <div className="msg-text">{m.content}</div>
                        </div>
                    ))}
                    {loading && <div className="msg-row">생각중…</div>}
                </div>

                <div className="ai-popup__input">
                    <input
                        value={this.state.input}
                        onChange={e => this.setState({ input: e.target.value })}
                        placeholder="명령을 입력하세요"
                        onKeyDown={(e) => e.key === 'Enter' ? this.handleSend() : null}
                    />
                    <button onClick={this.handleSend}>전송</button>
                </div>
            </div>
        );
    }
}

export default connect(
    (state, ownProps) => ({
        thread: selectThreadById(state, ownProps.threadId)
    })
)(AIViewPopup);
