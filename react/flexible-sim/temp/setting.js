import React from 'react';
import PopupBase from './PopupBase';
import { connect } from 'react-redux';
import { setAIViewBackground } from '../../actions';

// 3-Stop(0/중간/끝) 슬라이더
class DiscreteSlider extends React.Component {
  constructor(props) {
    super(props);
    const idx = this.getIndexFromValue(props.value, props.stops, props.defaultIndex || 0);
    this.state = {
      index: idx,          // 0|1|2
      dragging: false,     // 드래그 중 여부
      dragPercent: idx * 50 // 드래그 중 임시 퍼센트(0~100)
    };
    this.trackRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    // 외부 컨트롤드 값이 바뀐 경우 동기화
    if (this.props.value !== prevProps.value && this.props.value != null) {
      const idx = this.getIndexFromValue(this.props.value, this.props.stops, this.state.index);
      if (idx !== this.state.index) {
        this.setState({ index: idx, dragPercent: idx * 50 });
      }
    }
  }

  componentWillUnmount() {
    // 혹시 남아있을 수 있는 전역 리스너 정리
    this.detachDragListeners();
  }

  getIndexFromValue(val, stops, fallback) {
    if (val == null) return fallback;
    const i = stops.findIndex(v => String(v) === String(val));
    return i >= 0 ? i : fallback;
  }

  getValueByIndex(index) {
    return this.props.stops[index];
  }

  clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // clientX → 트랙 기준 퍼센트(0~100)
  posToPercent = (clientX) => {
    if (!this.trackRef.current) return 0;
    const rect = this.trackRef.current.getBoundingClientRect();
    const ratio = this.clamp((clientX - rect.left) / rect.width, 0, 1);
    return ratio * 100;
  };

  // 클릭 시 근접 스냅
  onTrackClick = (e) => {
    // 드래그 시작의 click 이벤트가 곂쳐서 이중 호출되는 이슈 방지
    if (this.state.dragging) return;
    const rect = this.trackRef.current.getBoundingClientRect();
    const ratio = this.clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const nextIndex = ratio < 1/3 ? 0 : (ratio < 2/3 ? 1 : 2);
    this.moveToIndex(nextIndex);
  };

  onLabelClick = (i) => this.moveToIndex(i);

  moveToIndex(nextIndex) {
    if (nextIndex === this.state.index) return;
    this.setState({ index: nextIndex, dragPercent: nextIndex * 50 }, () => {
      if (this.props.onChange) {
        this.props.onChange(this.getValueByIndex(nextIndex), nextIndex);
      }
    });
  }

  // ----- 드래그 -----
  attachDragListeners() {
    window.addEventListener('mousemove', this.onDragMoveMouse);
    window.addEventListener('mouseup', this.onDragEndMouse);
    window.addEventListener('touchmove', this.onDragMoveTouch, { passive: false });
    window.addEventListener('touchend', this.onDragEndTouch);
  }
  detachDragListeners() {
    window.removeEventListener('mousemove', this.onDragMoveMouse);
    window.removeEventListener('mouseup', this.onDragEndMouse);
    window.removeEventListener('touchmove', this.onDragMoveTouch);
    window.removeEventListener('touchend', this.onDragEndTouch);
  }

  onDragStart = (clientX) => {
    const p = this.posToPercent(clientX);
    this.setState({ dragging: true, dragPercent: p });
    this.attachDragListeners();
  };
  onDragMove = (clientX) => {
    if (!this.state.dragging) return;
    const p = this.posToPercent(clientX);
    this.setState({ dragPercent: p });
  };
  onDragEnd = () => {
    if (!this.state.dragging) return;
    const { dragPercent } = this.state;
    const nextIndex = dragPercent < 33.333 ? 0 : (dragPercent < 66.666 ? 1 : 2);
    this.detachDragListeners();
    this.setState({ dragging: false }, () => this.moveToIndex(nextIndex));
  };

  // 마우스/터치 래퍼
  onDragStartMouse = (e) => { e.preventDefault(); this.onDragStart(e.clientX); };
  onDragMoveMouse  = (e) => { e.preventDefault(); this.onDragMove(e.clientX); };
  onDragEndMouse   = (e) => { e.preventDefault(); this.onDragEnd(); };

  onDragStartTouch = (e) => { if (!e.touches[0]) return; this.onDragStart(e.touches[0].clientX); };
  onDragMoveTouch  = (e) => { if (!e.touches[0]) return; e.preventDefault(); this.onDragMove(e.touches[0].clientX); };
  onDragEndTouch   = () => { this.onDragEnd(); };
  // ------------------

  render() {
    const { title, stops, unit } = this.props;
    const { index, dragging, dragPercent } = this.state;

    const percent = dragging ? dragPercent : index * 50;    // 0, 50, 100 or 드래그 중 임시 값
    const currentValue = stops[index];

    return (
      <div className="searchTerm">
        <div className="searchTermContent">
          <div className="searchTermTitle">{title}</div>

          <div className="searchTermBarWrap">
            <div
              className="searchTermBar"
              ref={this.trackRef}
              onClick={this.onTrackClick}
              onMouseDown={this.onDragStartMouse}
              onTouchStart={this.onDragStartTouch}
            >
              <div className="searchTermBarFill" style={{ width: percent + '%' }} />

              {/* stop dots (클릭 가능) */}
              <button
                type="button"
                className={'stopDot ' + (index === 0 ? 'active' : '')}
                style={{ left: '0%' }}
                onClick={() => this.onLabelClick(0)}
                aria-label={`${stops[0]}${unit}`}
              />
              <button
                type="button"
                className={'stopDot ' + (index === 1 ? 'active' : '')}
                style={{ left: '50%' }}
                onClick={() => this.onLabelClick(1)}
                aria-label={`${stops[1]}${unit}`}
              />
              <button
                type="button"
                className={'stopDot ' + (index === 2 ? 'active' : '')}
                style={{ left: '100%' }}
                onClick={() => this.onLabelClick(2)}
                aria-label={`${stops[2]}${unit}`}
              />

              {/* 썸(회색 원) */}
              <div
                className={'searchTermThumb' + (dragging ? ' dragging' : '')}
                style={{ left: `calc(${percent}% - 11px)` }}
                onMouseDown={this.onDragStartMouse}
                onTouchStart={this.onDragStartTouch}
              />
            </div>

            {/* 하단 라벨 (클릭 가능) */}
            <div className="searchTermList">
              {stops.map((v, i) => (
                <span
                  key={v}
                  className={'stopLabel ' + (index === i ? 'selected' : '')}
                  onClick={() => this.onLabelClick(i)}
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 우측 값 배지 */}
        <div className="searchTermValue">{currentValue}{unit}</div>
      </div>
    );
  }
}

class AIViewColorSetting extends PopupBase {
  constructor(props) {
    super(props);
    const language = (global.CONFIG && global.CONFIG.language) || {};
    this.language = {
      save: language['ButtonSave'] || '저장',
      cancel: language['ButtonCancel'] || '취소',
      savemsg: language['SaveMessage'] || '저장되었습니다.',
      aiViewBackground: language['BizWorksAIViewSetBackground'] || 'AI 검색화면 템플릿 설정',
      aiViewSearchTerm: language['BizWorksAIViewSetFont'] || 'AI 검색화면 기간'
    };
    this.state = {
      defaultDays: 60,
      lastWeekDays: 7,
      lastMonthDays: 30
    };
  }

  onClickSaveButton = () => {
    const { defaultDays, lastWeekDays, lastMonthDays } = this.state;
    // TODO: 실서버 저장 API 호출
    // this.bizrunner.saveAIRanges({ defaultDays, lastWeekDays, lastMonthDays }).then(() => { ... });
    alert(this.language.savemsg);
    this.onClickCancel();
  };

  renderSearchTerm() {
    return (
      <div className="aiSetting">
        <div className="searchHeader">
          <div className="searchTitle">AI 검색화면 기간</div>
          <div className="searchSubTitle">
            Cube Channel은 최근 30일 기간이 default로 적용됩니다. 특정 기간을 등록하여 검색 기간을 설정할 수 있습니다.
          </div>
        </div>

        <div className="termContent">
          <DiscreteSlider
            title="Default 검색 범위(Days)"
            stops={[0, 60, 180]}
            unit="일"
            value={this.state.defaultDays}
            defaultIndex={1}
            onChange={(v) => this.setState({ defaultDays: v })}
          />
          <DiscreteSlider
            title="지난 주 검색 범위(Days)"
            stops={[0, 3, 7]}
            unit="일"
            value={this.state.lastWeekDays}
            defaultIndex={2}
            onChange={(v) => this.setState({ lastWeekDays: v })}
          />
          <DiscreteSlider
            title="지난 달 검색 범위(Days)"
            stops={[0, 15, 30]}
            unit="일"
            value={this.state.lastMonthDays}
            defaultIndex={2}
            onChange={(v) => this.setState({ lastMonthDays: v })}
          />
        </div>
      </div>
    );
  }

  renderButton() {
    const { save, cancel } = this.language;
    return (
      <div className="btnWc">
        <button type="button" className="btnL btnOk" onClick={this.onClickSaveButton}>
          {save}
        </button>
        <button type="button" className="btnL" onClick={this.onClickCancel}>
          {cancel}
        </button>
      </div>
    );
  }

  renderContent() {
    return (
      <div className="ntf">
        {this.renderSearchTerm()}
        {this.renderButton()}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  messages: state.messages,
  background: state.assistant && state.assistant.backgroundImg,
});

export default connect(mapStateToProps, { setAIViewBackground })(AIViewColorSetting);