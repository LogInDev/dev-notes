// AIThreadList.jsx
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openAIPanel, clickDetailTabItem } from '../../../actions';
import NewWindow from 'react-new-window';
import { Provider } from 'react-redux';
import store from '../../../store'; // store는 별도 모듈에서 export
import AIViewPopup from '../../popup/AIViewPopup';
import slimscroll from 'slimscroll';

class AIThreadList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentId: '0',
      openPopups: [], // ['3','7', ...]  ← 동시에 여러 개 관리
    };

    this.loadMore = this.loadMore.bind(this);
    this.onSlimscroll = this.onSlimscroll.bind(this);

    this.scrollTop = 0;
    this.isUpdate = false;
    this.listId = 'aithread';
    this.listEl = null;
    this.slimscroll = null;

    this.popWidth = 900;
    this.popHeight = 700;
  }

  componentDidMount() {
    this.listEl = document.getElementById(this.listId);
    if (this.listEl) this.listEl.addEventListener('slimscroll', this.onSlimscroll);
    this.initScroll();
  }

  componentWillUnmount() {
    if (this.listEl) this.listEl.removeEventListener('slimscroll', this.onSlimscroll);
    this.listEl = null;
    this.destroySlimscroll();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.dmusers?.searchtext !== this.props.dmusers?.searchtext) {
      this.scrollTop = 0;
      this.isUpdate = true;
    }
    if (this.isUpdate) {
      this.initScroll();
      this.isUpdate = false;
    }
  }

  initScroll() {
    this.destroySlimscroll();
    const target = document.getElementById(this.listId);
    if (!target) return;

    // 사용 중인 slimscroll 패키지에 맞춰 옵션 키 조정 필요
    this.slimscroll = new slimscroll({
      idSelector: '#aithread',
      height: 400,
      scrollTo: this.scrollTop,
    });
    if (typeof this.slimscroll.init === 'function') this.slimscroll.init();
  }

  destroySlimscroll() {
    if (!this.slimscroll) return;
    if (typeof this.slimscroll.destroy === 'function') this.slimscroll.destroy();
    else if (typeof this.slimscroll.teardown === 'function') this.slimscroll.teardown();
    this.slimscroll = null;
  }

  onSlimscroll(e) {
    this.scrollTop = e.target?.scrollTop || 0;
  }

  loadMore(listcount) {
    this.isUpdate = true;
  }

  // 리스트 항목 클릭 → 현재 선택만 변경
  openAIView = (e) => {
    this.props.clickDetailTabItem('aiview');
    const id = e.currentTarget.dataset.id;
    this.setState({ currentId: id });
  };

  // 우클릭 → 해당 li의 팝업 추가 (동시에 여러 개)
  openAIPopup = (e) => {
    e.preventDefault();
    const id = e.currentTarget.dataset.id;

    // 이미 열려 있으면 중복 추가하지 않음
    this.setState((s) =>
      s.openPopups.indexOf(id) >= 0 ? s : { openPopups: [...s.openPopups, id] }
    );
  };

  // 특정 팝업 닫기
  closePopup = (id) => {
    this.setState((s) => ({ openPopups: s.openPopups.filter((x) => x !== id) }));
  };

  // 모든 팝업 닫기 (옵션)
  closeAllPopups = () => {
    this.setState({ openPopups: [] });
  };

  // 창이 겹치지 않게 살짝씩 어프셋 주기 (옵션)
  getPopupFeatures = (index) => {
    const baseLeft = 120;
    const baseTop = 80;
    const step = 30;
    return {
      width: this.popWidth,
      height: this.popHeight,
      left: baseLeft + index * step,
      top: baseTop + index * step,
    };
  };

  render() {
    const { currentId, openPopups } = this.state;
    const arr = Array.from({ length: 10 }, (_, i) => i + 1);

    return (
      <div>
        <div style={{ marginBottom: 8 }}>
          <button onClick={this.closeAllPopups} disabled={openPopups.length === 0}>
            모든 팝업 닫기
          </button>
        </div>

        <ul
          className="list2"
          id={this.listId}
          style={{ overflow: 'auto', height: 400 }}
        >
          {arr.map((_, idx) => (
            <li
              key={idx}
              data-id={idx}                         {/* ✅ 각 li에 data-id 부여 */}
              onClick={this.openAIView}
              onContextMenu={this.openAIPopup}      {/* 우클릭으로 팝업 */}
            >
              <div className="con">
                <div className="arrow_box">channelName</div>
                <a className={currentId === String(idx) ? 'on' : ''} title="channelName">
                  <span>channelName - {idx}</span>
                  <span>data.last_message</span>
                </a>
              </div>

              <div className="etc">
                <span className="dm_alarm">alarmSettingClass</span>
                <span className="ppnum"><i className="fa fa-user" /></span>
                <span>99+</span>
              </div>
            </li>
          ))}
        </ul>

        {/* ✅ 여러 팝업 동시 렌더: openPopups 배열을 map */}
        {openPopups.map((id, i) => (
          <NewWindow
            key={id}
            title={`AI POPUP #${id}`}
            features={this.getPopupFeatures(i)}
            onUnload={() => this.closePopup(id)}
          >
            <Provider store={store}>
              <AIViewPopup
                onClose={() => this.closePopup(id)}
                currentId={id}                {/* ← 팝업마다 고유 id 전달 */}
                height={this.popHeight}
              />
            </Provider>
          </NewWindow>
        ))}
      </div>
    );
  }
}

export default connect(null, { openAIPanel, clickDetailTabItem })(AIThreadList);