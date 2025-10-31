// RangeSlider.js
import React from 'react';

/** 연속값 Range Slider (드래그 & 입력 양방향, RAF로 즉시 반응)
 * 디자인/마크업/CSS 클래스명은 절대 변경하지 않음.
 * props: { title, min, max, step, unit, value, onChange }
 */
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

    // 기존 구조 유지: 바깥 트랙 + 안쪽 래핑 엘리먼트들
    this.trackRef = React.createRef();        // .searchTermBar
    this.fillRef  = React.createRef();        // .searchTermBarFill
    this.fillWrapRef = React.createRef();     // .searchTermBarFillWrap
    this.thumbRef = React.createRef();        // .searchTermThumb
    this.thumbWrapRef = React.createRef();    // .searchTermThumbWrap

    this._raf = null;
  }

  componentDidMount() {
    this.applyVisual(this.valueToPercent(this.getValue()));
  }

  componentDidUpdate(prevProps) {
    const { value, min = 1, max = 100 } = this.props;

    // 외부 value 변경 또는 범위 변경 시 시각/상태 동기화
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

  /** 마우스/터치 좌표를 실제 조작 레인(thumbWrap)의 폭 기준 percent로 변환 */
  posToPercent = (clientX) => {
    const laneEl = this.thumbWrapRef.current || this.trackRef.current;
    if (!laneEl) return 0;
    const rect = laneEl.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * 100;
  };

  percentToValue = (percent) => {
    const { min = 1, max = 100, step = 1 } = this.props;
    const raw = min + (percent / 100) * (max - min);
    const stepped = Math.round(raw / step) * step;
    return this.clampNumber(stepped, min, max);
  };

  /** 렌더 사이클 없이 즉시 시각 반영 (바 채움/썸 위치) */
  applyVisual = (percent) => {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(() => {
      if (this.fillRef.current)  this.fillRef.current.style.width = percent + '%';
      if (this.thumbRef.current) this.thumbRef.current.style.left  = `calc(${percent}% - 11px)`;
    });
  };

  /** 드래그 시 transition 일시 해제(지연 제거) */
  toggleDraggingVisual = (on) => {
    if (this.fillRef.current)  this.fillRef.current.style.transition = on ? 'none' : '';
    if (this.thumbRef.current) {
      this.thumbRef.current.style.transition = on ? 'none' : '';
      this.thumbRef.current.style.cursor = on ? 'grabbing' : '';
    }
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
    this.toggleDraggingVisual(true);
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

    // 즉시 반응
    this.applyVisual(this.valueToPercent(nextValue));

    // 값 업데이트(컨트롤드/언컨트롤드)
    if (nextValue !== this.getValue()) {
      if (this.props.value == null) {
        this.setState({ internalValue: nextValue, inputText: String(nextValue) });
      } else {
        this.setState({ inputText: String(nextValue) });
      }
      if (this.props.onChange) this.props.onChange(nextValue);
    }
  };
  onDragEnd = () => {
    if (!this.state.dragging) return;
    this.detachDragListeners();
    this.toggleDraggingVisual(false);
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
    // 클릭도 실제 조작 레인 기준
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

  /* ---------- Input (즉시 반영) ---------- */
  onInputChange = (e) => {
    const text = e.target.value;
    // 숫자만 허용
    if (!/^\d*$/.test(text)) return;

    if (text === '') {
      // 입력창만 비우고 값은 유지
      this.setState({ inputText: '' });
      return;
    }

    const { min = 1, max = 100, step = 1 } = this.props;
    let num = parseInt(text, 10);
    if (isNaN(num)) return;

    num = Math.round(num / step) * step;
    num = this.clampNumber(num, min, max);

    // 즉시 이동
    this.applyVisual(this.valueToPercent(num));

    // 상태 갱신(컨트롤드/언컨트롤드)
    if (this.props.value == null) {
      this.setState({ internalValue: num, inputText: String(num) });
    } else {
      this.setState({ inputText: String(num) });
    }

    if (this.props.onChange) this.props.onChange(num);
  };

  onInputBlur = () => {
    // 빈 입력 시 현재 값으로 복원
    if (this.state.inputText === '') {
      const v = this.getValue();
      this.setState({ inputText: String(v) }, () => {
        this.applyVisual(this.valueToPercent(v));
      });
    }
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
          <div className="searchTermBarWrap">

            <div
              className="searchTermBar"
              ref={this.trackRef}
              onClick={this.onTrackClick}
              onMouseDown={this.onDragStartMouse}
              onTouchStart={this.onDragStartTouch}
            >
              <div className="searchTermBarFillWrap" ref={this.fillWrapRef}>
                <div
                  className="searchTermBarFill"
                  ref={this.fillRef}
                  style={{ width: percent + '%' }}
                />
              </div>

              <div className="searchTermThumbWrap" ref={this.thumbWrapRef}>
                <div
                  className={'searchTermThumb' + (this.state.dragging ? ' dragging' : '')}
                  style={{ left: `calc(${percent}% - 11px)`, top: '-5px' }}
                  ref={this.thumbRef}
                  onMouseDown={this.onDragStartMouse}
                  onTouchStart={this.onDragStartTouch}
                />
              </div>
            </div>

            <div className="searchTermList">
              <span className="stopLabel">{min}</span>
              <span className="stopLabel">{mid}</span>
              <span className="stopLabel">{max}</span>
            </div>
          </div>
        </div>

        <div className="searchTermValue">
          <input
            type="number"
            min={min}
            max={max}
            value={this.state.inputText}
            onChange={this.onInputChange}   {/* ← 타이핑마다 즉시 이동 */}
            onBlur={this.onInputBlur}      {/* 빈값 복원 */}
            className="searchTermValueInput"
            aria-label={`${title} 값 입력`}
          />
          <span className="searchTermValueUnit">{unit}</span>
        </div>
      </div>
    );
  }
}

export default RangeSlider;