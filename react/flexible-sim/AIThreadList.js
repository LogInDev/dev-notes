// AIThreadList.jsx
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openAIPanel, clickDetailTabItem } from '../../../actions';
import NewWindow from 'react-new-window';
import { Provider } from 'react-redux';
import store from '../../../store'; // ✅ store는 별도 모듈에서 export
import AIViewPopup from '../../popup/AIViewPopup';
import slimscroll from 'slimscroll';

class AIThreadList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpenPop: false,
      currentId: '0',
    };

    this.loadMore = this.loadMore.bind(this);
    this.onSlimscroll = this.onSlimscroll.bind(this);

    this.scrollTop = 0;
    this.isUpdate = false;
    this.listId = 'aithread';
    this.listEl = null;
    this.slimscroll = null;
  }

  /* ✅ 마운트: 컨테이너에만 이벤트 등록 + 초기화 */
  componentDidMount() {
    this.listEl = document.getElementById(this.listId);
    if (this.listEl) {
      this.listEl.addEventListener('slimscroll', this.onSlimscroll);
    }
    this.initScroll();
  }

  /* ✅ 언마운트: 이벤트/인스턴스 정리 */
  componentWillUnmount() {
    if (this.listEl) {
      this.listEl.removeEventListener('slimscroll', this.onSlimscroll);
      this.listEl = null;
    }
    this.destroySlimscroll();
  }

  /* ✅ props 변화 감지 + 재초기화 (componentWillReceiveProps 대체) */
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

  /* ✅ slimscroll 초기화/재초기화 (이전 인스턴스 정리) */
  initScroll() {
    this.destroySlimscroll();

    // ⚠️ 사용 중인 slimscroll 패키지의 문서에 따라 옵션 키를 맞추세요.
    // 아래는 DOM element를 직접 받는 형태 예시입니다.
    const target = document.getElementById(this.listId);
    if (!target) return;

    this.slimscroll = new slimscroll({
      target,             // 또는 { el: target } 등 패키지에 맞추기
      height: 400,        // 컨테이너 실제 높이 (부모가 100% 보장 안 될 때 고정값 권장)
      scrollTo: this.scrollTop,
      // allowPageScroll: false,
    });

    if (typeof this.slimscroll.init === 'function') {
      this.slimscroll.init();
    }
  }

  destroySlimscroll() {
    if (!this.slimscroll) return;
    if (typeof this.slimscroll.destroy === 'function') {
      this.slimscroll.destroy();
    } else if (typeof this.slimscroll.teardown === 'function') {
      this.slimscroll.teardown();
    }
    this.slimscroll = null;
  }

  /* ✅ 스크롤 이벤트 핸들러(컨테이너에 바인딩) */
  onSlimscroll(e) {
    this.scrollTop = e.target?.scrollTop || 0;

    const { dmusers } = this.props;
    const userlist = dmusers?.userlist || [];
    const totalcount = dmusers?.totalcount || 0;

    if (!totalcount || totalcount <= userlist.length) return;

    // 필요 조건에 맞게 트리거 (예: 끝에 가까울 때만 등)
    if (this.scrollTop > 0) this.loadMore(userlist.length);
  }

  loadMore(listcount) {
    // TODO: 다음 목록 로딩 액션 디스패치 등
    // ex) this.props.fetchNextThreads(listcount)
    this.isUpdate = true;
  }

  /* ✅ 안전한 식별: data-id + currentTarget */
  openAIView = (e) => {
    this.props.clickDetailTabItem('aiview');
    const id = e.currentTarget.getAttribute('data-id');
    this.setState({ currentId: id });
  };

  /* ✅ 우클릭 팝업 (브라우저 기본메뉴 차단) */
  openAIPopup = (e) => {
    e.preventDefault();
    this.setState({ isOpenPop: true });
  };

  handlePopupClose = () => {
    this.setState({ isOpenPop: false });
  };

  render() {
    const { isOpenPop, currentId } = this.state;
    const arr = Array.from({ length: 10 }, (_, i) => i + 1);

    return (
      <div>
        <ul
          className="list2"
          id={this.listId}
          style={{
            overflow: 'auto',   // ❗️overflow hidden 금지
            width: 'auto',
            height: 400,        // 부모 레이아웃이 100%를 보장 못하면 고정 높이 권장
          }}
        >
          AI-THREAD
          {arr.map((_, idx) => (
            <li
              key={idx}
              data-id={idx}
              onClick={this.openAIView}
              onContextMenu={this.openAIPopup}
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
                <span className="ppnum">
                  <i className="fa fa-user" />
                </span>
                <span>99+</span>
              </div>
            </li>
          ))}
        </ul>

        {/* ✅ 리스트 우클릭 시 새창 팝업 */}
        {isOpenPop && (
          <NewWindow
            title="AI POPUP"
            features={{ width: 900, height: 700, left: 120, top: 80 }}
            onUnload={this.handlePopupClose}
          >
            {/* 같은 Redux store를 새 문서에 다시 주입 → 상태 공유 */}
            <Provider store={store}>
              <AIViewPopup onClose={this.handlePopupClose} />
            </Provider>
          </NewWindow>
        )}
      </div>
    );
  }
}

/* mapStateToProps가 필요하면 성능을 고려해 slice만 구독하세요 */
export default connect(
  null,
  { openAIPanel, clickDetailTabItem }
)(AIThreadList);