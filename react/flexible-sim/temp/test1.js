import React from 'react';
import moment from 'moment';
import * as Store from 'GlobalStore';
import CommentItem from './CommentItem';
import MessageBase from './MessageBase';
import DatePicker from 'react-datepicker';
import TimePicker from 'rc-time-picker';
import * as Socket from 'socket';
//import 'react-datepicker/dist/react-datepicker.css';
import slimscroll from 'util/slimscroll';
import * as Actions from 'actions';
//import 'rc-time-picker/assets/index.css';
//import 'react-datepicker/dist/react-datepicker.css';

const defaultProps = {
  hasOverlink: false,
  isSame: false
};

class RichNotificationItem extends MessageBase {
  constructor(props) {
    super(props);

    this.requestObj = []; //리치노티에서 필요로 하는 값을 입력받는 태그 or 값
    this.richOptionData = [];
    this.answer = this.props.message.rnanswer || false;
    this.dateFormat = 'YYYY/MM/DD'; //TODO 데이트 피커에서 사용할 날짜 형식

    this.languageType = global.CONFIG.languageType - 1;

    let language = global.CONFIG.language || {};

    this.language = {
      richNotificationBotMassage: language['RichNotificationBotMassage'] || '요청하신 질문에 대한 답이 {COUNT}개 존재합니다.',
      viewList: language['BizWorksViewList'] || '리스트보기',
      contentView: language['BizWorksContentView'] || '내용보기'
    };

    this.state = {
      register_name: (this.props.message.register_name_m !== undefined && this.props.message.register_name_m !== '') ? this.props.message.register_name_m[Store.getProfile().languageType - 1] : this.props.message.register_name,
      position_name: (this.props.message.position_name_m !== undefined && this.props.message.position_name_m !== '') ? this.props.message.position_name_m[Store.getProfile().languageType - 1] : (this.props.message.position_name === '' ? this.language.etc : this.props.message.position_name),
      dept_name: (this.props.message.dept_name_m !== undefined && this.props.message.dept_name_m !== '') ? this.props.message.dept_name_m[Store.getProfile().languageType - 1] : (this.props.message.dept_name === '' ? this.language.etc : this.props.message.dept_name),
      select_idx: 0,
      isShowBotList: false,
      list_idx: 0
    };

    this.errorHandler = this.errorHandler.bind(this);

    if (Object.keys(this.answer).length < 1) {
      this.answer = false;
    }

    try {
      if (this.props.message.rndata && this.props.message.rndata.richnotification) {
        this.richnotification = this.props.message.rndata.richnotification;

        if (!this.answer) {
          let commonIDs = {
            cubechannelid: this.props.message.channel_id + '',
            cubemessageid: this.props.message.message_id,
            cubelanguagetype: global.CONFIG.languageType,
            cubeaccountid: global.CONFIG.login.userid + '',
            cubeuniquename: global.CONFIG.login.uniquename
          };
          if (this.richnotification.content && this.richnotification.content instanceof Array)
            this.richnotification.content.forEach((rich, idx) => {
              if (rich.process && rich.process.requestid instanceof Array) {
                let obj = {};
                rich.process.requestid.forEach(r => {
                  obj[r] = commonIDs[r.toLowerCase()] || {};
                });
                this.requestObj.push(obj);
              }
            });
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  componentDidUpdate() {
    if (this.state.isShowBotList) {
      this.slimscroll = new slimscroll({
        height: '268px',
        idSelector: '.botlistinner'
      });

      this.slimscroll.init();
    }
  }

  renderExtra() {
    try {
      console.log('message-------------', this.props.message)
      if (this.richnotification) {
        if (!this.answer) {
          this.answer = this.props.message.rnanswer || false;
          if (Object.keys(this.answer).length < 1) {
            this.answer = false;
          }
        }
        let { header, content, result } = this.richnotification;
        let from = header.from.toLowerCase();
        this.toUniqueName = header.to.uniquename;

        if (result && result === 'multireply') {
          let contents = content.map((rich, idx) => {
            return this.renderRichBot(rich, idx);
          });
          return (
            <div className="richbotbox">
              <div className="richbottop">
                <span>{this.language.richNotificationBotMassage.replace('{COUNT}', content.length)}</span>
                <span className="botlistbutton" onClick={() => this.setState({ isShowBotList: !this.state.isShowBotList })}>
                  <span className="botlistleft">{this.language.viewList}</span>
                  <span className="botlistright">
                    <i className="fa fa-angle-down" />
                  </span>
                </span>
              </div>
              {contents}
              {this.state.isShowBotList && this.renderRichBotList(content, header.from)}
            </div>
          );
        } else if (content && content instanceof Array) {
          return content.map((rich, idx) => {
            return this.renderRich(rich, idx);
          });
        }
      }
      return false; //형식에 맞지 않을 경우 그리지 않는다.
    } catch (e) {
      console.log(e);
      return 'Error Incorrect Telegram';
    }
  }

  renderRich(rich, idx) {
    let _this = this;
    this.isBot = false;
    let { body, header } = rich;
    if (!this.richOptionData[idx]) this.richOptionData.push({});
    if (header.to && header.to.uniquename) this.toUniqueName = header.to.uniquename;
    if (body && body.row instanceof Array) {
      let maxCount = body.row.length - 1;

      let isOnlyLabel = true;
      body.row.forEach(row => {
        row.column.forEach(column => {
          if (column.type !== 'label' && column.type !== 'hypertext') isOnlyLabel = false;
        });
      });

      let rows = body.row.map((row, _idx) => {
        let rowClass = _idx === 0 && maxCount === 0 ? ' rowfirst rowlast' : _idx === 0 ? ' rowfirst' : _idx === maxCount ? ' rowlast' : ' rowmiddle';
        if (isOnlyLabel) rowClass = ' richrowonlylable';
        return this.renderRow(row, idx + '_' + _idx, idx, rowClass);
      });

      return (
        <div className="richbox" key={idx}>
          {rows}
        </div>
      );
    } else {
      return false;
    }
  }

  renderRow(row, key, idx, rowClass) {
    let _this = this;
    let { column, align, bgcolor, border, width } = row;
    let cssProps = {};
    if (typeof align === 'string' && align.trim()) {
      cssProps = { textAlign: align.toLowerCase() };
    }

    if (typeof bgcolor === 'string' && bgcolor.trim()) {
      cssProps = { ...cssProps, backgroundColor: bgcolor.toLowerCase() };
    }

    if (typeof border === 'boolean' && border) {
      cssProps = { ...cssProps, border: '1px solid #d4d4d4' };
    }

    if (typeof width === 'string' && width.trim()) {
      cssProps = { ...cssProps, width: width.indexOf('%') === -1 && width.toLowerCase().indexOf('px') === -1 ? width.toLowerCase() + '%' : width.toLowerCase() };
    }

    let cols =
      column instanceof Array
        ? column.map((col, _idx) => {
            return _this.renderColumn(col, key + '_' + _idx, idx);
          })
        : false;

    return (
      <div key={key} style={cssProps} className={'richrow' + rowClass}>
        {cols}
      </div>
    );
  }

  renderRichBot(rich, idx) {
    let { body, header } = rich;
    if (header.to && header.to.uniquename) this.toUniqueName = header.to.uniquename;
    this.isBot = true;
    let sel_idx = this.state.select_idx;
    let last_idx = this.richnotification.content.length - 1;
    let leftClass = sel_idx === 0 ? ' richarrowdisabled' : '';
    let rightClass = sel_idx === last_idx ? ' richarrowdisabled' : '';

    let contentClassName = 'botcontent';
    let isContentClick = false;
    if (header.to.uniquename instanceof Array) {
      header.to.uniquename.forEach(item => {
        if (item === global.CONFIG.login.uniquename) {
          contentClassName = 'botcontent active';
          isContentClick = true;
        }
      });
    } else if (header.to.uniquename instanceof String) {
      if (header.to.uniquename === global.CONFIG.login.uniquename) {
        contentClassName = 'botcontent active';
        isContentClick = true;
      }
    }

    if (body && body.row instanceof Array && idx === sel_idx) {
      let rows = [];
      if (header && header.from) {
        let profile = Store.getStore().getState().profile.profile;
        // let { uniqueName } = this.props.profile;
        let companyCode = profile.companyCode;
        let imgurl = '';
        let bot_name = header.fromusername && header.fromusername.length > 0 ? header.fromusername[this.languageType] : header.from;
        if (typeof header.from === 'string' && header.from.trim().length > 0) {
          if (typeof global.CONFIG.legacy.getLegacyInfo === 'function') {
            let legacyInfo = global.CONFIG.legacy.getLegacyInfo('PROFILE_PHOTO', companyCode);
            if (legacyInfo) {
              imgurl = legacyInfo.url.replace(/{{uniqueName}}/gi, header.from);
            } else {
              legacyInfo = global.CONFIG.legacy.getLegacyInfo('PROFILE_PHOTO', 1000);
              if (legacyInfo) {
                imgurl = legacyInfo.url.replace(/{{uniqueName}}/gi, header.from);
              }
            }
          }
        }
        rows.push(
          <div key={idx + '_header'} className={'first'} style={{ display: 'flex' }}>
            <div className="richprofileimage">
              <img src={imgurl} onError={this.errorHandler} alt="" />
            </div>
            <p className="richprofilename">{bot_name}</p>
          </div>
        );
      }

      let bodyrows = body.row.map((row, _idx) => {
        return this.renderRowBot(row, idx + '_' + _idx, idx, rows.length === 0 ? 'first' : _idx === body.row.length - 1 ? 'last' : 'middle');
      });

      rows = rows.concat(<div className="richbotcontent">{bodyrows}</div>);

      return (
        <div className="botmassage" key={idx}>
          <div className="arrow leftarrow">
            <a onClick={() => sel_idx > 0 && this.setState({ select_idx: sel_idx - 1 })}>
              <i className={'fa fa-chevron-circle-left' + leftClass} />
            </a>
          </div>
          <div className={contentClassName} onClick={event => this.botProcess(event, rich, isContentClick)}>
            {rows}
            <div className="botclickdiv" />
          </div>
          <div className="arrow rightarrow">
            <a onClick={() => sel_idx < last_idx && this.setState({ select_idx: sel_idx + 1 })}>
              <i className={'fa fa-chevron-circle-right' + rightClass} />
            </a>
          </div>
        </div>
      );
    } else {
      return false;
    }
  }

  renderRowBot(row, key, idx, className) {
    let _this = this;
    let { column, align, bgcolor, border, width } = row;
    let cssProps = {};
    if (typeof align === 'string' && align.trim()) {
      cssProps = { textAlign: align.toLowerCase() };
    }

    if (typeof bgcolor === 'string' && bgcolor.trim()) {
      cssProps = { ...cssProps, backgroundColor: bgcolor.toLowerCase() };
    }

    if (typeof border === 'boolean' && border) {
      cssProps = { ...cssProps, border: '1px solid #d4d4d4' };
    }

    if (typeof width === 'string' && width.trim()) {
      cssProps = { ...cssProps, width: width.indexOf('%') === -1 && width.toLowerCase().indexOf('px') === -1 ? width.toLowerCase() + '%' : width.toLowerCase() };
    }

    let cols =
      column instanceof Array
        ? column.map((col, _idx) => {
            return _this.renderColumn(col, key + '_' + _idx, idx);
          })
        : false;

    return (
      <div key={key} className={className} style={cssProps}>
        {cols}
      </div>
    );
  }

  renderRichBotList(content, rootHeaderFrom) {
    let contents = content.map((rich, idx) => {
      let { header, process } = rich;
      let bot_name = rootHeaderFrom;
      if (header && header.from) {
        bot_name = header.fromusername && header.fromusername.length > 0 ? header.fromusername[this.languageType] : header.from;
      }

      let bot_summary = process.summary[this.languageType];
      return (
        <div key={header.from + '_' + idx}>
          <div className="botlistnamebox">{bot_name}</div>
          <div className="botlistsummarybox" onClick={() => this.setState({ select_idx: idx, isShowBotList: false })}>
            <pre>{bot_summary}</pre>
          </div>
        </div>
      );
    });

    return (
      <div className="botlist">
        <div className="botlistinner">{contents}</div>
      </div>
    );
  }

  renderColumn(col, key, idx) {
    let { align, width, bgcolor, border, valign } = col;
    let cssProps = {};
    if (typeof align === 'string' && align.trim()) {
      cssProps = { textAlign: align.toLowerCase() };
    }

    if (typeof valign === 'string' && valign.trim()) {
      cssProps = { ...cssProps, verticalAlign: valign.toLowerCase() };
    }

    if (typeof width === 'string' && width.trim()) {
      cssProps = {
        ...cssProps,
        width: width.indexOf('%') === -1 && width.toLowerCase().indexOf('px') === -1 ? width.toLowerCase() + '%' : width.toLowerCase()
        //width: width.indexOf('%') === -1 && width.toLowerCase().indexOf('px') === -1 ? width.toLowerCase() + '%' : width.indexOf('100%') > -1 ? false : width.toLowerCase()
      };
    }

    if (typeof bgcolor === 'string' && bgcolor.trim()) {
      cssProps = { ...cssProps, backgroundColor: bgcolor.toLowerCase() };
    }

    if (typeof border === 'boolean' && border) {
      cssProps = { ...cssProps, border: '1px solid #d4d4d4' };
    }

    let itemProps = { style: cssProps };

    return (
      <span className="richcolumn" {...itemProps}>
        {this.renderControl(col, key, idx)}
      </span>
    );
  }
