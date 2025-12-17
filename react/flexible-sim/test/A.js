import React from 'react';

class RangeSlider extends React.Component {
  constructor(props) {
    super(props);

    const { min = 1, max = 100 } = props;
    const initial = this.initValue(props, min, max);

    this.state = {
      dragging: false,
      internalValue: initial,
      inputText: String(initial),
    };

    this.trackRef = React.createRef();
    this.fillRef = React.createRef();
    this.fillWrapRef = React.createRef();
    this.thumbRef = React.createRef();
    this.thumbWrapRef = React.createRef();

    this._raf = null;
  }

  initValue(props, min, max) {
const foundThread = threadList.find(
  thread => thread.channel_id === currentThreadId
);

const favoriteStatus =
  (threadInfoSummary &&
    threadInfoSummary[currentThreadId] &&
    threadInfoSummary[currentThreadId].channel_info &&
    threadInfoSummary[currentThreadId].channel_info.isFavorite) ??
  (foundThread && foundThread.favorite) ??
  false;
    const foundThread = threadList.find(thread => thread.channel_id === currentThreadId);

    const favoriteStatus = threadInfoSummary && threadInfoSummary[currentThreadId]
          ? threadInfoSummary[currentThreadId].channel_info.isFavorite
          : (foundThread && foundThread.favorite) || false;

    copyPopupId(popupId) {
  const doc =
    (this.props.popupWindow && this.props.popupWindow.document) || document;

  const textarea = doc.createElement('textarea');
  textarea.value = String(popupId);   // 엔터 안 붙는 핵심
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';

  doc.body.appendChild(textarea);

  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    doc.execCommand('copy');
  } catch (e) {
    console.error('copy failed', e);
  }

  doc.body.removeChild(textarea);
}
    if (props.value != null) {
      return this.clampNumber(props.value, min, max);
    }
    const base =
      props.defaultValue != null ? props.defaultValue : min;
    return this.clampNumber(base, min, max);
  }

  componentDidMount() {
    const v = this.getValue();
    this.applyVisual(this.valueToPercent(v));
  }

  componentDidUpdate(prevProps, prevState) {
    const { min = 1, max = 100, value } = this.props;
    const prevMin = prevProps.min == null ? 1 : prevProps.min;
    const prevMax = prevProps.max == null ? 100 : prevProps.max;

    // ### 컨트롤드 모드 (props.value 사용)
    if (value != null) {
      const valueChanged = value !== prevProps.value;
      const rangeChanged = min !== prevMin || max !== prevMax;

      if (valueChanged || rangeChanged) {
        const clamped = this.clampNumber(value, min, max);
        const percent = this.valueToPercent(clamped);
        this.applyVisual(percent);

        const text = String(clamped);
        if (this.state.inputText !== text) {
          this.setState({ inputText: text });
        }
      }
      return;
    }

    // ### 언컨트롤드 모드 (내부 state 사용) - min/max 변경 대응
    if (min !== prevMin || max !== prevMax) {
      const clamped = this.clampNumber(this.state.internalValue, min, max);
      const text = String(clamped);

      if (
        clamped !== this.state.internalValue ||
        text !== this.state.inputText
      ) {
        this.setState(
          {
            internalValue: clamped,
            inputText: text,
          },
          () => {
            this.applyVisual(this.valueToPercent(clamped));
          }
        );
      }
      return;
    }

    // 내부 값이 바뀐 경우 시각만 동기화
    if (
      this.state.internalValue !== prevState.internalValue &&
      this.props.value == null
    ) {
      this.applyVisual(this.valueToPercent(this.state.internalValue));
    }
  }

  componentWillUnmount() {
    this.detachDragListeners();
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  clampNumber = (n, min, max) => Math.max(min, Math.min(max, n));

  getValue = () => {
    const { value, min = 1, max = 100 } = this.props;
    if (value != null) {
      return this.clampNumber(value, min, max);
    }
    return this.state.internalValue;
  };

  valueToPercent = (val) => {
    const { min = 1, max = 100 } = this.props;
    if (max === min) return 0;
    const ratio = (val - min) / (max - min);
    return ratio * 100;
  };

  posToPercent = (clientX) => {
    const laneEl = this.thumbWrapRef.current || this.trackRef.current;
    if (!laneEl) return 0;
    const rect = laneEl.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / rect.width)
    );
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
      if (this.fillRef.current) {
        this.fillRef.current.style.width = percent + '%';
      }
      if (this.thumbRef.current) {
        this.thumbRef.current.style.left = `calc(${percent}% - 11px)`;
      }
    });
  };

  toggleDraggingVisual = (on) => {
    if (this.fillRef.current) {
      this.fillRef.current.style.transition = on ? 'none' : '';
    }
    if (this.thumbRef.current) {
      this.thumbRef.current.style.transition = on ? 'none' : '';
      this.thumbRef.current.style.cursor = on ? 'grabbing' : '';
    }
  };

  attachDragListeners() {
    window.addEventListener('mousemove', this.onDragMoveMouse);
    window.addEventListener('mouseup', this.onDragEndMouse);
    window.addEventListener('touchmove', this.onDragMoveTouch, {
      passive: false,
    });
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

    const text = String(nextValue);

    if (this.props.value == null) {
      this.setState(
        {
          dragging: true,
          internalValue: nextValue,
          inputText: text,
        },
        () => {
          this.applyVisual(this.valueToPercent(this.getValue()));
          this.attachDragListeners();
          if (this.props.onChange) this.props.onChange(this.getValue());
        }
      );
    } else {
      this.setState(
        {
          dragging: true,
          inputText: text,
        },
        () => {
          this.applyVisual(this.valueToPercent(nextValue));
          this.attachDragListeners();
          if (this.props.onChange) this.props.onChange(nextValue);
        }
      );
    }
  };

  onDragMove = (clientX) => {
    if (!this.state.dragging) return;
    const percent = this.posToPercent(clientX);
    const nextValue = this.percentToValue(percent);

    this.applyVisual(this.valueToPercent(nextValue));

    const current = this.getValue();
    if (nextValue === current) return;

    const text = String(nextValue);

    if (this.props.value == null) {
      this.setState({
        internalValue: nextValue,
        inputText: text,
      });
    } else {
      this.setState({ inputText: text });
    }

    if (this.props.onChange) this.props.onChange(nextValue);
  };

  onDragEnd = () => {
    if (!this.state.dragging) return;
    this.detachDragListeners();
    this.toggleDraggingVisual(false);
    this.setState({ dragging: false });
  };

  onDragStartMouse = (e) => {
    e.preventDefault();
    this.onDragStart(e.clientX);
  };
  onDragMoveMouse = (e) => {
    e.preventDefault();
    this.onDragMove(e.clientX);
  };
  onDragEndMouse = (e) => {
    e.preventDefault();
    this.onDragEnd();
  };

  onDragStartTouch = (e) => {
    if (!e.touches[0]) return;
    this.onDragStart(e.touches[0].clientX);
  };
  onDragMoveTouch = (e) => {
    if (!e.touches[0]) return;
    e.preventDefault();
    this.onDragMove(e.touches[0].clientX);
  };
  onDragEndTouch = () => {
    this.onDragEnd();
  };

  onTrackClick = (e) => {
    // 드래그 중에는 클릭 무시
    if (this.state.dragging) return;

    const percent = this.posToPercent(e.clientX);
    const nextValue = this.percentToValue(percent);
    const text = String(nextValue);

    this.applyVisual(this.valueToPercent(nextValue));

    if (this.props.value == null) {
      this.setState({
        internalValue: nextValue,
        inputText: text,
      });
    } else {
      this.setState({ inputText: text });
    }

    if (this.props.onChange) this.props.onChange(nextValue);
  };

  onInputChange = (e) => {
    const text = e.target.value;
    // 숫자만 허용
    if (!/^\d*$/.test(text)) return;

    // 빈 문자열은 일단 그대로 둠
    if (text === '') {
      this.setState({ inputText: '' });
      return;
    }

    const { min = 1, max = 100, step = 1 } = this.props;
    let num = parseInt(text, 10);
    if (isNaN(num)) return;

    num = Math.round(num / step) * step;
    num = this.clampNumber(num, min, max);

    const fixedText = String(num);

    this.applyVisual(this.valueToPercent(num));

    if (this.props.value == null) {
      this.setState({
        internalValue: num,
        inputText: fixedText,
      });
    } else {
      this.setState({ inputText: fixedText });
    }

    if (this.props.onChange) this.props.onChange(num);
  };

  onInputBlur = () => {
    if (this.state.inputText === '') {
      const v = this.getValue();
      const text = String(v);
      this.setState({ inputText: text }, () => {
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
            >
              <div
                className="searchTermBarFillWrap"
                ref={this.fillWrapRef}
              >
                <div
                  className="searchTermBarFill"
                  ref={this.fillRef}
                  style={{ width: percent + '%' }}
                />
              </div>

              <div
                className="searchTermThumbWrap"
                ref={this.thumbWrapRef}
              >
                <div
                  className={
                    'searchTermThumb' +
                    (this.state.dragging ? ' dragging' : '')
                  }
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

export default RangeSlider;
