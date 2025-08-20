// src/popup/PopupLauncher.jsx
import React from 'react';
import NewWindow from 'react-new-window';
import { Provider } from 'react-redux';
import store from '../store';
import AIPanel from './AIPanel';
import { setQuery } from '../store/ai/actions';
import { EventBus } from '../bus/eventBus';

export default class PopupLauncher extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false, input: '' };
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.onChange = this.onChange.bind(this);
    this.sendEvent = this.sendEvent.bind(this);
  }

  handleOpen() {
    this.setState({ open: true });
  }
  handleClose() {
    this.setState({ open: false });
  }
  onChange(e) {
    this.setState({ input: e.target.value });
  }
  sendEvent() {
    // EventBus로 팝업에 “재조회” 이벤트 알림
    EventBus.emit('AI:REFRESH', { query: this.state.input.trim() });
    // Redux 상태도 부모에서 곧장 변경 가능(팝업과 스토어 공유)
    store.dispatch(setQuery(this.state.input.trim()));
  }

  render() {
    const { open, input } = this.state;
    return (
      <div>
        <input
          value={input}
          onChange={this.onChange}
          placeholder="질문 입력"
          style={{ marginRight: 8 }}
        />
        <button onClick={this.sendEvent} style={{ marginRight: 8 }}>
          이벤트로 새로고침
        </button>
        <button onClick={this.handleOpen}>AI 패널 새창</button>

        {open && (
          <NewWindow
            title="AI Panel"
            features={{ width: 900, height: 700, left: 120, top: 80 }}
            onUnload={this.handleClose}
          >
            {/* ★ 부모와 동일한 Redux Store/Context 공유 */}
            <Provider store={store}>
              <AIPanel onClose={this.handleClose} />
            </Provider>
          </NewWindow>
        )}
      </div>
    );
  }
}
