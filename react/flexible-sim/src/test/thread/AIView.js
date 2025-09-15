import React, { Component, createRef } from 'react';
import { connect } from 'react-redux';
import { aiExecuteQuery, aiSetLoading } from '../../store/actions';
import { selectCurrentThreadId, selectThreadById } from '../../store/selectors';
import { ensureThreadListener } from '../../socket/aiListeners';

// props로 sock/eventbus, apihandler를 주입받는다고 가정
class AIAssistantView extends Component {
    constructor(props) {
        super(props);
        this.state = { input: '' };
        this.inputRef = createRef();
    }

    handleChange = (e) => this.setState({ input: e.target.value });

    handleSend = () => {
        const text = (this.state.input || '').trim();
        if (!text) return;

        const { sock, apihandler, currentThreadId } = this.props;
        const eb = sock && sock.eventbus;
        if (!apihandler || !eb) return;

        // 1) API 요청 → threadId 즉시 응답
        apihandler.aiSend({ text }, (reply) => {
            const threadId = reply?.body?.threadId;
            if (!threadId) {
                console.error('aiSend: threadId 없음');
                return;
            }
            // 2) 리스너 보장 등록
            ensureThreadListener(eb, threadId);

            // 3) 사용자 메시지 + 로딩 on
            this.props.dispatch(aiExecuteQuery({ threadId, text }));
            this.props.dispatch(aiSetLoading(threadId, true));

            // 입력 초기화
            this.setState({ input: '' });
        });
    };

    render() {
        const { currentThreadId, thread } = this.props;
        const loading = !!(thread && thread.loading);

        return (
            <div className="ai-view">
                <div className="ai-view__header">
                    <strong>AI Assistant</strong>
                    <span style={{ marginLeft: 8, opacity: 0.6 }}>
            {currentThreadId || '(thread 없음)'}
          </span>
                </div>

                <div className="ai-view__messages">
                    {(thread?.contents || []).map(m => (
                        <div key={m.messageId} className={`msg-row ${m.role}`}>
                            <div className="msg-author">{m.role === 'user' ? 'Me' : 'cubeChatBot'}</div>
                            <div className="msg-text">{m.content}</div>
                        </div>
                    ))}
                    {loading && <div className="msg-row">생각중…</div>}
                </div>

                <div className="ai-view__input">
                    <input
                        ref={this.inputRef}
                        value={this.state.input}
                        onChange={this.handleChange}
                        placeholder="질문을 입력하세요"
                        onKeyDown={(e) => e.key === 'Enter' ? this.handleSend() : null}
                    />
                    <button onClick={this.handleSend}>전송</button>
                </div>
            </div>
        );
    }
}

export default connect(
    (state) => {
        const currentThreadId = selectCurrentThreadId(state);
        return {
            currentThreadId,
            thread: selectThreadById(state, currentThreadId)
        };
    }
)(AIAssistantView);

