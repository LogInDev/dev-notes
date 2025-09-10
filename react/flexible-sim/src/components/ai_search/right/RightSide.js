import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './right.css';

const LS_KEY = 'cube.rightside.width';

class RightSide extends Component {
  constructor(props) {
    super(props);

    const defaultWidth = props.defaultWidth || 360;
    const minWidth = props.minWidth || 280;
    const maxWidth = props.maxWidth || 720;

    const saved = Number(window.localStorage.getItem(LS_KEY));
    const initial = isFinite(saved) ? saved : defaultWidth;

    this.state = {
      panelWidth: Math.max(minWidth, Math.min(maxWidth, initial)),
      startDate: moment(),
      _dragging: false
    };

    // 바인딩
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.handleChangeDate = this.handleChangeDate.bind(this);

    // 리사이즈 상태
    this.startX = 0;
    this.startW = 0;

    // 제한
    this.minWidth = minWidth;
    this.maxWidth = maxWidth;
  }

  componentDidMount() {
    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
  }

  componentWillUnmount() {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    this.teardownDraggingEffects();
  }

  handleChangeDate(date) {
    this.setState({ startDate: date });
  }
  
  onPointerDown(e) {
  this.setState({ _dragging: true });
  this.startX = e.clientX;
  this.startW = this.rightEl ? this.rightEl.offsetWidth : this.state.panelWidth;

  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}

onPointerMove(e) {
  if (!this.state._dragging) return;

  // 방향 그대로 반영
  const dx = this.startX - e.clientX;
  let next = this.startW + dx;

  // 최소/최대 폭 제한
  if (next < this.minWidth) next = this.minWidth;
  if (next > this.maxWidth) next = this.maxWidth;

  this.setState({ panelWidth: next }, () => {
    window.localStorage.setItem(LS_KEY, String(this.state.panelWidth));
  });
}

  

  onPointerDown(e) {
    // 좌측 핸들 잡을 때만
    this.setState({ _dragging: true });
    this.startX = e.clientX;
    this.startW = this.rightEl ? this.rightEl.offsetWidth : this.state.panelWidth;

    // 드래그 UX 개선
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    // 포인터 캡처(드래그 중 바깥으로 나가도 추적)
    if (e.target.setPointerCapture) {
      try { e.target.setPointerCapture(e.pointerId); } catch(_) {}
    }
  }

  onPointerMove(e) {
    if (!this.state._dragging) return;

    const dx = this.startX - e.clientX; // 좌로 끌면 dx > 0 (너비 증가), 우로 끌면 dx < 0 (너비 감소)
    let next = this.startW + dx;
    if (next < this.minWidth) next = this.minWidth;
    if (next > this.maxWidth) next = this.maxWidth;

    if (next !== this.state.panelWidth) {
      this.setState({ panelWidth: next }, () => {
        window.localStorage.setItem(LS_KEY, String(this.state.panelWidth));
        // 필요하면 콜백
        if (typeof this.props.onResize === 'function') {
          this.props.onResize(this.state.panelWidth);
        }
      });
    }
  }

  onPointerUp() {
    if (!this.state._dragging) return;
    this.setState({ _dragging: false }, () => {
      this.teardownDraggingEffects();
    });
  }

  teardownDraggingEffects() {
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  render() {
    const { messages } = this.props;
    const { startDate, panelWidth, _dragging } = this.state;

    return (
      <section
        className={`ai-search-right ${_dragging ? 'is-dragging' : ''}`}
        ref={el => (this.rightEl = el)}
        style={{
          width: panelWidth,
          flex: '0 0 auto' // flex 컨테이너에서 고정 폭
        }}
      >
      
      /* 예: 좌측 메인 + 우측 RightSide */
<div style={{display:'flex', width:'100%', height:'100%'}}>
  <main style={{flex:'1 1 auto', minWidth:0, background:'#f8fafc'}}>…메시지 리스트…</main>
  <RightSide minWidth={280} maxWidth={720} defaultWidth={360}/>
</div>
      
        {/* ⬅️ 좌측 리사이즈 핸들 */}
        <div
          className="rs-resizer"
          onPointerDown={this.onPointerDown}
          title="드래그하여 패널 너비 조절"
        />

        <div className="search-result native-scroll">
          {/* 상단: 날짜 인풋(표시) */}
          <div className="datepicker-wrapper">
            <input
              type="text"
              value={moment(startDate).format('YYYY.MM.DD')}
              readOnly
              className="date-input has-calendar-bg"
            />
          </div>

          {/* 항상 보이는 달력 */}
          <DatePicker
            selected={startDate}
            onChange={this.handleChangeDate}
            dateFormat="YYYY.MM.DD"
            dateFormatCalendar="YYYY.MM"
            inline
          />

          {messages.length === 0 && (
            <div className="msg msg--hint">왼쪽에서 검색 이력을 선택하세요.</div>
          )}
          {messages.map(m => (
            <div key={m.id || m.seq} className={`msg ${m.role === 'user' ? 'msg--me' : 'msg--bot'}`}>
              {m.text}
            </div>
          ))}
        </div>

        <div className="composer">
          <input placeholder="(지금은 비활성)"/>
          <button disabled>🔎</button>
        </div>
      </section>
    );
  }
}

export default connect(s => ({ messages: s.result.messages }))(RightSide);