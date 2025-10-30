.searchTermBarFill{ transition: width .15s ease; }
.searchTermThumb{ transition: left .15s ease; cursor: grab; }
.searchTermThumb.dragging,
.searchTermBar.dragging .searchTermBarFill{ transition: none; }
.searchTermThumb.dragging{ cursor: grabbing; }

class DiscreteSlider extends React.Component {
  constructor(props){
    super(props);
    const idx = this.getIndexFromValue(props.value, props.stops, props.defaultIndex || 0);
    this.state = { index: idx, dragging: false, dragPercent: idx * 50 };

    this.trackRef = React.createRef();
    this.fillRef  = React.createRef();
    this.thumbRef = React.createRef();

    // 드래그 중 setState 대신 쓰는 내부 값 + raf 핸들
    this._dragPercent = idx * 50;
    this._raf = null;
  }

  // ----- 유틸 -----
  applyVisual = (percent) => {
    // RAF로 묶어 페인트 최소화
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(() => {
      if (this.fillRef.current)  this.fillRef.current.style.width = percent + '%';
      if (this.thumbRef.current) this.thumbRef.current.style.left  = `calc(${percent}% - 11px)`;
    });
  };

  onDragStart = (clientX) => {
    const p = this.posToPercent(clientX);
    this._dragPercent = p;
    this.setState({ dragging: true }, () => {
      // 시각 즉시 반영 + dragging 클래스 적용
      this.applyVisual(this._dragPercent);
      if (this.trackRef.current) this.trackRef.current.classList.add('dragging');
      if (this.thumbRef.current) this.thumbRef.current.classList.add('dragging');
    });
    this.attachDragListeners();
  };

  onDragMove = (clientX) => {
    if (!this.state.dragging) return;
    this._dragPercent = this.posToPercent(clientX);
    this.applyVisual(this._dragPercent); // state 없이 바로 적용
  };

  onDragEnd = () => {
    if (!this.state.dragging) return;
    const nextIndex = this._dragPercent < 33.333 ? 0 : (this._dragPercent < 66.666 ? 1 : 2);

    this.detachDragListeners();
    if (this.trackRef.current) this.trackRef.current.classList.remove('dragging');
    if (this.thumbRef.current) this.thumbRef.current.classList.remove('dragging');

    // 스냅 확정만 state로
    this.setState({ dragging: false }, () => this.moveToIndex(nextIndex));
  };
  render(){
    const { title, stops, unit } = this.props;
    const { index, dragging } = this.state;

    // 최초 렌더/드래그 아님: state 기반으로 초기 위치 렌더
    const percent = dragging ? this._dragPercent : (index * 50);
    const currentValue = stops[index];

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

            {/* stopDots 생략 */}

            <div
              className={'searchTermThumb' + (dragging ? ' dragging' : '')}
              ref={this.thumbRef}
              style={{ left: `calc(${percent}% - 11px)` }}
              onMouseDown={this.onDragStartMouse}
              onTouchStart={this.onDragStartTouch}
            />
          </div>

          {/* 하단 라벨 생략 */}
        </div>

        <div className="searchTermValue">{currentValue}{unit}</div>
      </div>
    );
  }
onTrackClick = (e) => {
  if (this.state.dragging) return;
  const rect = this.trackRef.current.getBoundingClientRect();
  const ratio = this.clamp((e.clientX - rect.left) / rect.width, 0, 1);
  const nextIndex = ratio < 1/3 ? 0 : (ratio < 2/3 ? 1 : 2);
  const targetPercent = nextIndex * 50;
  this.applyVisual(targetPercent); // 즉시 반영
  this.moveToIndex(nextIndex);     // 상태 확정
};


