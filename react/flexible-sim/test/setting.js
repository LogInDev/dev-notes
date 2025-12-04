getValue = () => {
  const { value, min = 1, max = 100 } = this.props;
  if (value != null) {
    return this.clampNumber(value, min, max);
  }
  return this.state.internalValue;
};

componentDidUpdate(prevProps) {
  const { value, min = 1, max = 100 } = this.props;

  // 컨트롤드 모드: 외부 value가 바뀌면 DOM만 업데이트
  if (value != null && value !== prevProps.value) {
    const v = this.clampNumber(value, min, max);
    this.applyVisual(this.valueToPercent(v));

    // inputText만 맞춰주고 싶으면, prevProps랑 비교해서 한 번만 setState
    if (String(v) !== this.state.inputText) {
      this.setState({ inputText: String(v) });
    }
    return;
  }

  // min/max 범위 변경 대응(필요하면)
  if ((min !== prevProps.min || max !== prevProps.max) && this.props.value == null) {
    const v = this.clampNumber(this.state.internalValue, min, max);
    if (v !== this.state.internalValue) {
      this.setState({ internalValue: v, inputText: String(v) });
      this.applyVisual(this.valueToPercent(v));
    }
  }
}

import React from 'react';
import { SketchPicker } from 'react-color';
import PopupBase from './PopupBase.js';
import RangeSlider from './RangeSlider.js';
import * as Socket from 'socket';
import * as Store from 'GlobalStore';
import { connect } from 'react-redux';
import { setThreadOptions } from '../../actions/index';

class AIViewColorSetting extends PopupBase {
  constructor(props) {
    super(props);

    let language = global.CONFIG.language || {};
    this.language = {
      save: language['ButtonSave'] || '저장',
      cancel: language['ButtonCancel'] || '취소',
      savemsg: language['SaveMessage'] || '저장되었습니다.',
      aiViewBackground:
        language['BizWorksAIViewSetBackground'] || 'AI 검색화면 템플릿 설정',
      aiViewSearchTerm:
        language['BizWorksAIViewSetFont'] || 'AI 검색화면 기간',
      templatemsg: language['TemplateSelected'] || '템플릿 색상 변경',
      aiVewBackcolor:
        language['BizWorksAIViewBackColor'] || '배경 색상',
      aiViewFontcolor:
        language['BizWorksAIViewFontColor'] || '폰트 색상',
    };

    this.state = {
      color: [],
      fontYN: false,
      selectedBackColor: '#ffffff',
      selectedFontColor: '#000000',
      weekMax: 7,
      monthMax: 30,
    };

    this.onChangeFontInputBox = this.onChangeFontInputBox.bind(this);
    this.onClickSaveButton = this.onClickSaveButton.bind(this);
    this.onChangeTab = this.onChangeTab.bind(this);
    this.onChangeRadioButton = this.onChangeRadioButton.bind(this);
  }

  // 폰트 컬러 input 변경 (지금은 UI만, 필요 시 setThreadOptions로 확장 가능)
  onChangeFontInputBox(e) {
    this.setState({ selectedFontColor: e.target.value });
  }

  onChangeTab(fontFlag) {
    this.setState({ fontYN: fontFlag });
  }

  onClickSaveButton() {
    const {
      templateType,
      defaultRange,
      lastWeekRange,
      lastMonthRange,
    } = this.props;

    const data = {
      displayType: templateType,
      defaultSearchRange: defaultRange,
      weekSearchRange: lastWeekRange,
      monthSearchRange: lastMonthRange,
      colorBack: null, // 필요 시 selectedBackColor 사용
      colorFont: null, // 필요 시 selectedFontColor 사용
      saveBtn: 'Y',
    };

    this.airunner
      .setAiThreadSetting(data)
      .then(() => {
        alert(this.language.savemsg);
        this.onClickCancel();
      });
  }

  // 템플릿 라디오 버튼 변경 → 리덕스에 바로 반영
  onChangeRadioButton(e) {
    const displayType = e.target.value;
    const { defaultRange, lastWeekRange, lastMonthRange } = this.props;
    this.props.setThreadOptions(
      displayType,
      defaultRange,
      lastWeekRange,
      lastMonthRange
    );
  }

  renderTab() {
    let { aiVewBackcolor, aiViewFontcolor } = this.language;
    let { fontYN } = this.state;
    let tab = (title, enable, fontFlag) => {
      return (
        <div
          className={'tabitem' + (enable ? '' : ' inactive')}
          onClick={() => {
            // 이미 활성 탭이면 아무 것도 안 함
            if (!enable) {
              this.onChangeTab(fontFlag);
            }
          }}
        >
          <span className="tabtext">{title}</span>
        </div>
      );
    };
    return (
      <div className="tabcontainer">
        {tab(aiVewBackcolor, !fontYN, false)}
        {tab(aiViewFontcolor, fontYN, true)}
      </div>
    );
  }

  renderButton() {
    let { save, cancel } = this.language;
    return (
      <div className="btnWc">
        <button
          type="button"
          className="btnL btnOk"
          onClick={this.onClickSaveButton}
        >
          {save}
        </button>
        <button
          type="button"
          className="btnL"
          onClick={this.onClickCancel.bind(this)}
        >
          {cancel}
        </button>
      </div>
    );
  }

  renderSearchTerm() {
    const { weekMax, monthMax } = this.state;
    const {
      templateType,
      defaultRange,
      lastWeekRange,
      lastMonthRange,
    } = this.props;

    return (
      <div className="aiSetting">
        <div className="searchHeader">
          <div className="searchTitle">AI 검색화면 기간</div>
          <div className="searchSubTitle">
            Cube Channel은 최근 30일 기간이 default로 적용됩니다. 특정 기간을
            등록하여 검색 기간을 설정할 수 있습니다.
          </div>
        </div>

        <div className="termContent">
          {/* 1) Default: 1 ~ 180 일 */}
          <RangeSlider
            title="Default 검색 범위(Days)"
            min={1}
            max={180}
            step={1}
            unit="일"
            value={defaultRange}
            onChange={(v) =>
              this.props.setThreadOptions(
                templateType,
                v,
                lastWeekRange,
                lastMonthRange
              )
            }
          />

          {/* 2) 지난 주: 1 ~ weekMax 일 */}
          <RangeSlider
            title="지난 주 검색 범위(Days)"
            min={1}
            max={weekMax}
            step={1}
            unit="일"
            value={Math.min(lastWeekRange, weekMax)}
            onChange={(v) =>
              this.props.setThreadOptions(
                templateType,
                defaultRange,
                v,
                lastMonthRange
              )
            }
          />

          {/* 3) 지난 달: 1 ~ monthMax 일 */}
          <RangeSlider
            title="지난 달 검색 범위(Days)"
            min={1}
            max={monthMax}
            step={1}
            unit="일"
            value={Math.min(lastMonthRange, monthMax)}
            onChange={(v) =>
              this.props.setThreadOptions(
                templateType,
                defaultRange,
                lastWeekRange,
                v
              )
            }
          />
        </div>
      </div>
    );
  }

  renderTemplate() {
    let { image } = global.CONFIG.resource;

    let template = [
      {
        img: <img src={image + '/aiassistant/setting/img-1.png'} alt="bgImage" />,
        value: 'A',
      },
      {
        img: <img src={image + '/aiassistant/setting/img-2.png'} alt="bgImage1" />,
        value: 'B',
      },
      {
        img: <img src={image + '/aiassistant/setting/img-3.png'} alt="bgImage2" />,
        value: 'C',
      },
      {
        img: <img src={image + '/aiassistant/setting/img-4.png'} alt="bgImage3" />,
        value: 'D',
      },
      {
        img: <img src={image + '/aiassistant/setting/img-5.png'} alt="bgImage4" />,
        value: 'E',
      },
      {
        img: <img src={image + '/aiassistant/setting/img-6.png'} alt="bgImage5" />,
        value: 'F',
      },
    ].map((radio) => {
      let checked = this.props.templateType === radio.value;
      return (
        <label key={radio.value}>
          <input
            type="radio"
            name="template"
            checked={checked}
            value={radio.value}
            onChange={this.onChangeRadioButton}
          />
          <div id="templatetype">{radio.img}</div>
        </label>
      );
    });

    return (
      <div>
        <div className="alrimchk3" id="mb_alrimchk3">
          {template}
        </div>
      </div>
    );
  }

  renderContent() {
    return (
      <div className="ntf">
        <div className="aiSetting">
          <div className="searchHeader">
            <div className="searchTitle">
              {this.language.aiViewBackground}
            </div>
          </div>
          {this.renderTemplate()}
        </div>
        <hr className="line01" />
        {this.renderSearchTerm()}
        {this.renderButton()}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    defaultRange: state.profile.defaultRange,
    lastWeekRange: state.profile.lastWeekRange,
    lastMonthRange: state.profile.lastMonthRange,
    templateType: state.profile.templateType,
  };
};

export default connect(mapStateToProps, { setThreadOptions })(
  AIViewColorSetting
);
