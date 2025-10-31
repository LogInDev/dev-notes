import React from 'react';
import PopupBase from './PopupBase';
import { connect } from 'react-redux';
import { setAIViewBackground } from '../../actions';

/** 연속값 Range Slider (드래그 & 입력 양방향, RAF로 즉시 반응) */
class RangeSlider extends React.Component {
  constructor(props) {
    super(props);
    const { value, min = 1, max = 100 } = props;
    const v = this.clampNumber(value != null ? value : min, min, max);
    this.state = {
      dragging: false,
      internalValue: v,
      inputText: String(v)
    };
    this.trackRef = React.createRef();
    this.fillRef  = React.createRef();
    this.thumbRef = React.createRef();
    this._raf = null;
  }

  componentDidMount() {
    this.applyVisual(this.valueToPercent(this.getValue()));
  }

  componentDidUpdate(prevProps) {
    const { value, min = 1, max = 100 } = this.props;

    if (value !== prevProps.value && value != null) {
      const v = this.clampNumber(value, min, max);
      this.setState({ internalValue: v, inputText: String(v) }, () => {
        this.applyVisual(this.valueToPercent(v));
      });
    } else if (min !== prevProps.min || max !== prevProps.max) {
      const v = this.clampNumber(this.getValue(), min, max);
      this.setState({ internalValue: v, inputText: String(v) }, () => {
        this.applyVisual(this.valueToPercent(v));
      });
    }
  }

  componentWillUnmount() {
    this.detachDragListeners();
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  /* ---------- Utils ---------- */
  clampNumber = (n, min, max) => Math.max(min, Math.min(max, n));
  getValue = () => (this.props.value != null ? this.props.value : this.state.internalValue);

  valueToPercent = (val) => {
    const { min = 1, max = 100 } = this.props;
    if (max === min) return 0;
    const ratio = (val - min) / (max - min);
    return ratio * 100;
  };

  percentToValue = (percent) => {
    const { min = 1, max = 100, step = 1 } = this.props;
    const raw = min + (percent / 100) * (max - min);
    const stepped = Math.round(raw / step) * step;
    return this.clampNumber(stepped, min, max);
  };

  applyVisual = (percent) => {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(() => {
      if (this.fillRef.current)  this.fillRef.current.style.width = percent + '%';
      if (this.thumbRef.current) this.thumbRef.current.style.left  = `calc(${percent}% - 11px)`;
    });
  };

  posToPercent = (clientX) => {
    if (!this.trackRef.current) return 0;
    const rect = this.trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * 100;
  };

  /* ---------- Drag ---------- */
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
    const percent = this.posToPercent(clientX);
    const nextValue = this.percentToValue(percent);
    this.setState({ dragging: true, internalValue: nextValue, inputText: String(nextValue) }, () => {
      this.applyVisual(this.valueToPercent(this.getValue()));
      this.attachDragListeners();
      if (this.props.onChange) this.props.onChange(this.getValue());
    });
  };
  onDragMove = (clientX) => {
    if (!this.state.dragging) return;
    const percent = this.posToPercent(clientX);
    const nextValue = this.percentToValue(percent);
    if (nextValue !== this.getValue()) {
      if (this.props.value == null) {
        this.setState({ internalValue: nextValue, inputText: String(nextValue) });
      } else {
        this.setState({ inputText: String(nextValue) });
      }
      this.applyVisual(this.valueToPercent(nextValue));
      if (this.props.onChange) this.props.onChange(nextValue);
    } else {
      this.applyVisual(this.valueToPercent(nextValue));
    }
  };
  onDragEnd = () => {
    if (!this.state.dragging) return;
    this.detachDragListeners();
    this.setState({ dragging: false });
  };

  onDragStartMouse = (e) => { e.preventDefault(); this.onDragStart(e.clientX); };
  onDragMoveMouse  = (e) => { e.preventDefault(); this.onDragMove(e.clientX); };
  onDragEndMouse   = (e) => { e.preventDefault(); this.onDragEnd(); };

  onDragStartTouch = (e) => { if (!e.touches[0]) return; this.onDragStart(e.touches[0].clientX); };
  onDragMoveTouch  = (e) => { if (!e.touches[0]) return; e.preventDefault(); this.onDragMove(e.touches[0].clientX); };
  onDragEndTouch   = () => { this.onDragEnd(); };

  /* ---------- Click ---------- */
  onTrackClick = (e) => {
    if (this.state.dragging) return;
    const percent = this.posToPercent(e.clientX);
    const nextValue = this.percentToValue(percent);
    this.applyVisual(this.valueToPercent(nextValue));
    if (this.props.value == null) {
      this.setState({ internalValue: nextValue, inputText: String(nextValue) });
    } else {
      this.setState({ inputText: String(nextValue) });
    }
    if (this.props.onChange) this.props.onChange(nextValue);
  };

  /* ---------- Input ---------- */
  onInputChange = (e) => {
    const text = e.target.value;
    if (/^\d*$/.test(text)) {
      this.setState({ inputText: text });
    }
  };

  onInputBlur = () => {
    const { min = 1, max = 100, step = 1 } = this.props;
    let num = parseInt(this.state.inputText, 10);
    if (isNaN(num)) num = this.getValue();
    num = Math.round(num / step) * step;
    num = this.clampNumber(num, min, max);

    if (this.props.value == null) {
      this.setState({ internalValue: num, inputText: String(num) }, () => {
        this.applyVisual(this.valueToPercent(num));
      });
    } else {
      this.setState({ inputText: String(num) }, () => {
        this.applyVisual(this.valueToPercent(num));
      });
    }
    if (this.props.onChange) this.props.onChange(num);
  };

  render() {
    const { title, min = 1, max = 100, unit = '' } = this.props;
    const value = this.getValue();
    const percent = this.valueToPercent(value);
    const mid = Math.round((min + max) / 2);

    return (
      <div className="searchTerm">
        <div className="searchTermContent">
          <div className="searchTermTitle">{title}</div>

          <div
            className="searchTermBar"
            ref={this.trackRef}
            onClick={this.onTrackClick}
            onMouseDown={this.onDragStartMouse}
            onTouchStart={this.onDragStartTouch}
          >
            <div className="searchTermBarFill" ref={this.fillRef} style={{ width: percent + '%' }} />
            <div
              className={'searchTermThumb' + (this.state.dragging ? ' dragging' : '')}
              ref={this.thumbRef}
              style={{ left: `calc(${percent}% - 11px)` }}
              onMouseDown={this.onDragStartMouse}
              onTouchStart={this.onDragStartTouch}
            />
          </div>

          <div className="searchTermList">
            <span className="stopLabel">{min}</span>
            <span className="stopLabel">{mid}</span>
            <span className="stopLabel">{max}</span>
          </div>
        </div>

        <div className="searchTermValue">
          <input
            type="number"
            min={min}
            max={max}
            value={this.state.inputText}
            onChange={this.onInputChange}
            onBlur={this.onInputBlur}
            className="searchTermValueInput"
            aria-label={`${title} 값 입력`}
          />
          <span className="searchTermValueUnit">{unit}</span>
        </div>
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
    };
    this.state = {
      // 모든 항목 연속 드래그 + 입력 편집 가능
      defaultDays: 60,   // 1~180
      lastWeekDays: 7,   // 1~weekMax
      lastMonthDays: 30, // 1~monthMax

      weekMax: 7,
      monthMax: 30
    };
  }

  onClickSaveButton = () => {
    const { defaultDays, lastWeekDays, lastMonthDays, weekMax, monthMax } = this.state;
    // TODO: API 저장
    alert(this.language.savemsg);
    this.onClickCancel();
  };

  renderSearchTerm() {
    const { defaultDays, lastWeekDays, lastMonthDays, weekMax, monthMax } = this.state;

    return (
      <div className="aiSetting">
        <div className="searchHeader">
          <div className="searchTitle">AI 검색화면 기간</div>
          <div className="searchSubTitle">
            모든 항목이 연속 드래그 가능합니다. 우측 숫자를 직접 입력해도 적용됩니다.
          </div>
        </div>

        <div className="termContent">
          {/* 1) 1~180 연속 */}
          <RangeSlider
            title="Default 검색 범위(Days)"
            min={1}
            max={180}
            step={1}
            unit="일"
            value={defaultDays}
            onChange={(v) => this.setState({ defaultDays: v })}
          />

          {/* 2) 1~weekMax 연속 (끝 숫자 유지/동적 가능) */}
          <RangeSlider
            title={`지난 주 검색 범위(Days) (최대 ${weekMax})`}
            min={1}
            max={weekMax}
            step={1}
            unit="일"
            value={Math.min(lastWeekDays, weekMax)}
            onChange={(v) => this.setState({ lastWeekDays: v })}
          />

          {/* 3) 1~monthMax 연속 (끝 숫자 유지/동적 가능) */}
          <RangeSlider
            title={`지난 달 검색 범위(Days) (최대 ${monthMax})`}
            min={1}
            max={monthMax}
            step={1}
            unit="일"
            value={Math.min(lastMonthDays, monthMax)}
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




.aiSetting{
  display:flex; flex-direction:column; gap:35px;
  width:min(720px,92%); margin:0 auto; padding-top:20px; text-align:left;
}
.searchHeader{ display:flex; flex-direction:column; gap:12px; }
.searchHeader .searchTitle{ font-weight:700; font-size:16px; }
.searchHeader .searchSubTitle{ color:#666; line-height:1.5; }

.termContent{ display:flex; flex-direction:column; gap:16px; }
.searchTerm{
  display:flex; align-items:center; gap:12px;
  border:1px solid #e6e6e6; border-radius:8px; padding:14px 16px;
  background:#fff;
}
.searchTermContent{ display:flex; flex-direction:column; gap:14px; align-items:flex-start; width:100%; }
.searchTermTitle{ font-weight:600; }

.searchTermBar{
  position:relative; width:100%; height:10px; border-radius:8px;
  background:#f1f1f1; cursor:pointer; overflow:hidden; user-select:none;
}
.searchTermBarFill{
  position:absolute; left:0; top:0; height:100%;
  background:linear-gradient(90deg,#7b30f2 0%, #2f7bf4 100%);
  border-radius:8px; pointer-events:none;
  transition: width .12s ease;
}
.searchTermBar.dragging .searchTermBarFill{ transition:none; }

.searchTermThumb{
  position:absolute; top:50%; width:22px; height:22px; margin-top:-11px;
  background:#fff; border:2px solid #d5d5d5; border-radius:50%;
  box-shadow:0 2px 6px rgba(0,0,0,.15);
  transition:left .12s ease;
  cursor:grab;
}
.searchTermThumb.dragging{ cursor:grabbing; transition:none; }

.searchTermList{ display:flex; justify-content:space-between; width:100%; }
.stopLabel{ width:32px; text-align:center; user-select:none; color:#666; }

.searchTermValue{
  background:#ebebeb; color:#222; border-radius:14px;
  padding:2px 8px; height:32px; display:flex; align-items:center; gap:4px;
}
.searchTermValueInput{
  width:64px; height:26px; border:1px solid #ccc; border-radius:6px;
  padding:0 8px; outline:none; background:#fff; text-align:right;
}
.searchTermValueUnit{ font-weight:600; }

@media (max-width:560px){
  .searchTerm{ flex-direction:column; align-items:stretch; }
  .searchTermValue{ align-self:flex-end; }
}