<body>
  <div id="root"></div>
  <div id="modal-root"></div>  <!-- 여기에만 모달을 렌더 -->
</body>


// SafePortal.js
import React from 'react';
import ReactDOM from 'react-dom';

export default class SafePortal extends React.Component {
  constructor(props) {
    super(props);
    this.el = document.createElement('div');
  }
  componentDidMount() {
    const modalRoot = document.getElementById('modal-root');
    if (modalRoot) modalRoot.appendChild(this.el);
  }
  componentWillUnmount() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  }
  render() {
    return ReactDOM.createPortal(this.props.children, this.el);
  }
}


import React, { Component } from 'react';
import SafePortal from '../common/SafePortal';     // 위에서 만든 포털 래퍼
import CreateChannel from '../../popup/CreateChannel';
import CreateDM from '../../popup/CreateDM';

class TutorialView extends Component {
  constructor(props) {
    super(props);

    const language = (global.CONFIG && global.CONFIG.language) || {};
    this.language = {
      addChannel: language['BizWorksAddChannel'] || '신규채널 개설',
      addDMChannel: language['AddDMChannel'] || '대화방 개설',
    };

    this.state = {
      openCreateChannel: false,
      openCreateDM: false,
      style: { display: 'block' },
    };
  }

  componentDidUpdate(prevProps) {
    // channelid가 바뀔 때 스타일 초기화 등 UI 리셋이 필요하다면 여기서만 처리
    if (prevProps.channelid !== this.props.channelid) {
      this.setState({ style: {} });
    }
  }

  createChannel = () => {
    this.setState({ openCreateChannel: true });
  };

  createDmChannel = () => {
    this.setState({ openCreateDM: true });
  };

  closeCreateChannel = () => {
    this.setState({ openCreateChannel: false });
  };

  closeCreateDM = () => {
    this.setState({ openCreateDM: false });
  };

  render() {
    const createChannelTitle = this.language.addChannel;
    const createDMTitle = this.language.addDMChannel;

    const { resource = {}, languageType = 1 } = global.CONFIG || {};
    const { image = '' } = resource;

    let langIdx = (languageType || 1) - 1;
    if (langIdx < 0) langIdx = 0;

    const langs = ['', '', '-eng', '-chn', ''];
    const path = '/tutorial/center-cube-msg' + langs[langIdx] + '.png';
    const hytubepath = '/tutorial/center-cube-msg' + langs[langIdx] + '_new.png';

    let isHytube = false;
    if (global.externalParam && global.externalParam.type === 'Hytube') {
      isHytube = true;
    }

    const chName = 'tutorial-btn-channel' + langs[langIdx];
    const dmName = 'tutorial-btn-dm' + langs[langIdx];

    return (
      <div className="tutorial-wrap" style={this.state.style}>
        <img className="tutorial-icon" src={image + '/tutorial/center-cube-icon.png'} alt="tutorial-icon" />
        <img
          className="tutorial-msg"
          src={image + (!isHytube ? path : hytubepath)}
          alt="tutorial-message"
        />

        {!isHytube && (
          <div className="tutorial-btn">
            <div className={chName} onClick={this.createChannel} />
            <div className={dmName} onClick={this.createDmChannel} />
          </div>
        )}

        {/* 모달은 항상 포털로! DOM 이동 금지 */}
        {this.state.openCreateChannel && (
          <SafePortal>
            <CreateChannel
              closeModal={this.closeCreateChannel}
              title={createChannelTitle}
              isLayer={true}
            />
          </SafePortal>
        )}
        {this.state.openCreateDM && (
          <SafePortal>
            <CreateDM
              closeModal={this.cliioseCreateDM}
              title={createDMTitle}
              isLayer={true}
            />
          </SafePortal>
        )}
      </div>
    );
  }
}

export default TutorialView;
