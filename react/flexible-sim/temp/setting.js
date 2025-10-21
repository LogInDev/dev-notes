import React from 'react';
import PopupBase from './PopupBase.js';
import { connect } from 'react-redux';
import { setAIViewBackground } from '../../actions/index';

/**
 * 라디오형 3-Stop 슬라이더 (0 / mid / max)
 * - props:
 *   title        : 타이틀 문자열
 *   stops        : [min(0), mid, max] 숫자 배열 (예: [0, 60, 180])
 *   unit         : 표시 단위 (예: '일')
 *   value        : 선택 값 (컨트롤드로 쓰고 싶으면 넘겨주고 onChange에서 관리)
 *   defaultIndex : 초기 인덱스 (0|1|2). value가 없으면 이 값 사용
 *   onChange     : (nextValue:number, nextIndex:0|1|2) => void
 */
class DiscreteSlider extends React.Component {
  constructor(props) {
    super(props);
    const idx = this.getIndexFromValue(props.value, props.stops, props.defaultIndex || 0);
    this.state = { index: idx };
    this.trackRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    // 외부에서 value가 컨트롤되는 경우 동기화
    if (this.props.value !== prevProps.value && this.props.value != null) {
      const idx = this.getIndexFromValue(this.props.value, this.props.stops, this.state.index);
      if (idx !== this.state.index) this.setState({ index: idx });
    }
  }

  getIndexFromValue(val, stops, fallback) {
    if (val == null) return fallback;
    const i = stops.findIndex(v => String(v) === String(val));
    return i >= 0 ? i : fallback;
  }

  getValueByIndex(index) {
    return this.props.stops[index];
  }

  // 트랙 클릭 → 비율로 근접 인덱스 계산(0,1,2)
  onTrackClick = (e) => {
    if (!this.trackRef.current) return;
    const rect = this.trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    // 0~0.33 => 0, 0.33~0.66 => 1, 0.66~1 => 2 (가운데에 민감도 약간 더 줌)
    const nextIndex = ratio < 1/3 ? 0 : (ratio < 2/3 ? 1 : 2);
    this.moveToIndex(nextIndex);
  };

  onLabelClick = (i) => {
    this.moveToIndex(i);
  };

  moveToIndex(nextIndex) {
    if (nextIndex === this.state.index) return;
    this.setState({ index: nextIndex }, () => {
      if (this.props.onChange) {
        this.props.onChange(this.getValueByIndex(nextIndex), nextIndex);
      }
    });
  }

  render() {
    const { title, stops, unit } = this.props;
    const { index } = this.state;

    const percent = index * 50; // 0, 50, 100
    const currentValue = stops[index];

    return (
      <div className="searchTerm">
        <div className="searchTermContent">
          <div className="searchTermTitle">{title}</div>

          <div className="searchTermBarWrap">
            {/* 클릭 가능한 전체 트랙 */}
            <div
              className="searchTermBar"
              ref={this.trackRef}
              onClick={this.onTrackClick}
            >
              <div className="searchTermBarFill" style={{ width: percent + '%' }} />
              {/* 고정 스톱 지점 가이드 (클릭영역 포함) */}
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
              {/* 핸들(회색 원) */}
              <div className="searchTermThumb" style={{ left: `calc(${percent}% - 11px)` }} />
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

        {/* 우측 값 표시 배지 */}
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
      // 기간 값들(서버에서 불러오면 setState로 갱신)
      defaultDays: 60, // 0|60|180
      lastWeekDays: 7, // 0|3|7
      lastMonthDays: 30 // 0|15|30
    };
  }

  componentDidMount() {
    // TODO: 기존 bizrunner 호출부가 있다면 여기서 초기값 세팅
    // ex) this.bizrunner.getAIDefaultRanges().then(({defaultDays, lastWeekDays, lastMonthDays}) => this.setState({defaultDays, lastWeekDays, lastMonthDays}));
  }

  onClickSaveButton = () => {
    const { defaultDays, lastWeekDays, lastMonthDays } = this.state;
    // TODO: API 저장
    // this.bizrunner.saveAIRanges({ defaultDays, lastWeekDays, lastMonthDays })
    //   .then(() => { alert(this.language.savemsg); this.onClickCancel(); });

    alert(this.language.savemsg);
    this.onClickCancel();
  };

  renderSearchTerm() {
    return (
      <div className="aiSetting">
        <div className="searchHeader">
          <div className="searchTitle">AI 검색화면 기간</div>
          <div className="searchSubTitle">
            Cube Channel은 최근 30일 기간이 default로 적용되어 검색결과가 생성됩니다.
            단, 특정 기간을 등록하여 검색 기간을 설정할 수 있습니다.
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