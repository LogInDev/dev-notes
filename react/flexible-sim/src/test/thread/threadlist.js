import React, { Component } from 'react';
import { connect } from 'react-redux';
import { selectThreads } from '../../store/selectors';
import { aiOpenThreadInPanel } from '../../store/actions';
import { ensureThreadListener } from '../../socket/aiListeners';

// props: { sock }
class AIThreadList extends Component {
  handleLeftClick = (threadId) => {
    const { sock } = this.props;
    const eb = sock && sock.eventbus;
    if (eb) ensureThreadListener(eb, threadId);
    this.props.dispatch(aiOpenThreadInPanel(threadId));
  };

  handleRightClick = (e, threadId) => {
    e.preventDefault();
    // 여기서 새창 팝업 로직(react-new-window 등)으로 팝업 열고,
    // 팝업에도 동일한 store와 sock, apihandler를 주입하면 동기화됨.
    // 팝업 내부에서 ensureThreadListener를 한 번 더 호출해도 _registered 가드로 중복 방지됨.
    const { sock } = this.props;
    const eb = sock && sock.eventbus;
    if (eb) ensureThreadListener(eb, threadId);
    window.open(`/ai-popup?threadId=${encodeURIComponent(threadId)}`, '_blank', 'width=900,height=700');
  };

  render() {
    const { threads } = this.props;

    return (
      <div className="ai-thread-list">
        {threads.map(t => (
          <div
            key={t.id}
            className="ai-thread-item"
            onClick={() => this.handleLeftClick(t.id)}
            onContextMenu={(e) => this.handleRightClick(e, t.id)}
          >
            {t.id}
          </div>
        ))}
      </div>
    );
  }
}

export default connect(
  (state) => ({ threads: selectThreads(state) })
)(AIThreadList);