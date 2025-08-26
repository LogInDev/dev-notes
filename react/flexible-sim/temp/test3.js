 renderList(control, key, idx) {
    let text = control.text;
    let listitem = control.listitem;
    let pageSize = control.pagesize || 0;
    let renderText =
      text && text.length > 0 ? (
        <div className="richlisttitle">
          <span>{text[this.languageType]}</span>
        </div>
      ) : (
        false
      );
    let renderItem = [];
    let renderPager;
    if (listitem.findIndex(row => row.type.toLowerCase() === 'container') > -1) {
      renderItem = this.renderListContainer(listitem, key, idx, true);
    } else if (pageSize && pageSize > 0 && listitem.length >= pageSize) {
      let list_size = Math.ceil(listitem.length / pageSize);
      let pagerItem = [];
      for (let i = 0; i < list_size; i++) {
        pagerItem.push(
          <a onClick={() => this.setState({ list_idx: i })}>
            <i className={i === this.state.list_idx ? 'fa fa-circle pageractive' : 'fa fa-circle'} />
          </a>
        );
      }
      renderPager = <div className="richlistpager">{pagerItem}</div>;

      let list_idx = this.state.list_idx * pageSize;
      renderItem = listitem.map((item, _idx) => {
        if (_idx >= list_idx && _idx < list_idx + pageSize) return this.renderColumn(item, key + '_' + _idx, idx);
        else return false;
      });
    } else {
      // renderItem = listitem.map((item, _idx) => {
      //   return this.renderColumn(item, key + '_' + _idx, idx);
      // });
      renderItem = this.renderListContainer(listitem, key, idx, false);
    }
    return (
      <div key={key} className="richlist">
        {renderText}
        <div className="richitemlist">{renderItem}</div>
        {renderPager}
      </div>
    );
  }

  renderListContainer = (listitem, key, idx, isContainer) => {
    let _idx = this.state.select_idx;
    let content;
    if (isContainer) content = this.renderControl(listitem[_idx], key + '_' + _idx, idx);
    else content = this.renderColumn(listitem[_idx], key + '_' + _idx, idx);
    let leftClass = _idx === 0 ? ' richarrowdisabled' : '';
    let rightClass = _idx === listitem.length - 1 ? ' richarrowdisabled' : '';
    let leftArrow = (
      <div className="arrow">
        <a onClick={() => _idx > 0 && this.setState({ select_idx: this.state.select_idx - 1 })}>
          <i className={'fa fa-chevron-circle-left' + leftClass} />
        </a>
      </div>
    );
    let rightArrow = (
      <div className="arrow">
        <a onClick={() => _idx < listitem.length - 1 && this.setState({ select_idx: this.state.select_idx + 1 })}>
          <i className={'fa fa-chevron-circle-right' + rightClass} />
        </a>
      </div>
    );
    return (
      <div className="richlistcontainer">
        {leftArrow}
        <div className="rlc_content">{content}</div>
        {rightArrow}
      </div>
    );
  };

  renderWebMetaItem(result) {
    var image = result.image ? result.image : '';
    if (image.startsWith('/')) image = result.url + image;

    return (
      <a className="webmeta" href={result.url} target="_blank">
        <div className="chatbox webmeta">
          <div className="image">
            <img src={image}  onError={i => i.target.style.display='none'} />
          </div>
          {result.title && (
            <div className="chatuser">
              <span className="name">{result.title}</span>
            </div>
          )}
          <div className="chatmsg">{result.description}</div>
        </div>
      </a>
    );
  }

  renderWebMeta() {
    const { og } = Store.getMessages();
    const { message } = this.props;

    var data = [],
      data1 = [];
    if (message.og) {
      data = message.og.map((meta, idx) => {
        if (meta.url !== undefined && meta.url !== null && meta.url !== '') return this.renderWebMetaItem(meta);
        else {
          return false;
        }
      });
    }

    data1 = og.map((meta, idx) => {
      if (meta.message_id === message.message_id && meta.result) {
        const { result } = meta;

        if (result.url !== undefined && result.url !== null && result.url !== '') return this.renderWebMetaItem(result);
        else {
          return false;
        }
      } else {
        return false;
      }
    });

    return data.concat(data1);
  }

  getSelectedDate = (processid, defalutDate, idx) => {
    if (this.state[idx + '_' + processid]) {
      return this.state[idx + '_' + processid];
    } else {
      if (!this.answer) this.requestObj[idx][processid] = defalutDate;
      return new moment(defalutDate);
    }
  };

  onChangeDate = (processid, idx) => {
    return date => {
      let state = { ...this.state };
      state[idx + '_' + processid] = date;
      this.setState(state, () => {
        this.requestObj[idx][processid] = date.format(this.dateFormat);
      });
    };
  };

  getSelectedDateTime = (processid, defalutDate, idx) => {
    if (this.state[idx + '_' + processid]) {
      return this.state[idx + '_' + processid];
    } else {
      //let date = moment(new Date( defalutDate)).format('YYYY/MM/DD');
      if (!this.answer) this.requestObj[idx][processid] = moment(new Date( defalutDate)).format('YYYY/MM/DD h:mm a');
      return new moment(defalutDate);
    }
  };

  onChangeDateTime = (processid, idx) => {
    return time => {
      let state = { ...this.state };
      state[idx + '_' + processid] = time;
      this.setState(state, () => {
        this.requestObj[idx][processid] = moment(new Date(time)).format('YYYY/MM/DD h:mm a');
      });
    };
  };

  getSelectedTime = (processid, date, idx) => {
    let state = { ...this.state };
    let resultidx = false;
    if(this.answer && this.answer.result.resultdata.length > 0){
      resultidx = this.answer.result.resultdata.findIndex(a => a.requestid === processid);
      
    }
  
    if (this.state[idx + '_' + processid]) {
      return this.state[idx + '_' + processid];
    } else {
      if (!this.answer) {
        date.hour(date.hour()).minute(date.minute());
      this.requestObj[idx][processid] =moment(date).format('YYYY/MM/DD h:mm a');
      return new moment(date);
      }else if( resultidx !== false  && resultidx > -1){
        date = this.answer.result.resultdata[resultidx].text[0].toString();
        return new moment(date);
      }
    }
  };

  onChangeTime(processid,idx) {
    return time => {
      let state = { ...this.state };
      time.hour(time.hour()).minute(time.minute());
      state[idx + '_' + processid] = new moment(time);
      this.setState(state, () => {
        this.requestObj[idx][processid] = new moment(time).format('YYYY/MM/DD h:mm a');
      });
    };
  }

  confirmProcess = (event, { processid, value, text, displaytext, confirmmsg }, richIdx) => {
    if (this.requestObj[richIdx][processid]) {
      this.requestObj[richIdx][processid] = value;
    }

    let datepickerid;
    let datetimepickerid;
    if (this.datepickerid && this.datepickerid[richIdx]) {
      datepickerid = this.datepickerid[richIdx].split('|');
    }
    if (this.datetimepickerid && this.datetimepickerid[richIdx]) {
      datetimepickerid = this.datetimepickerid[richIdx].split('|');
    }
    let requestValue = {};
    let requestText = {};
    //let requestDisplayText = {};
    for (let prop in this.requestObj[richIdx]) {
      const obj = this.requestObj[richIdx][prop];

      if (obj instanceof Element) {
        requestValue[prop] = obj.value;
        if (obj.selectedOptions) requestText[prop] = obj.selectedOptions[0].innerText;
        else requestText[prop] = obj.value;
              //requestDisplayText[prop] = obj.displaytext;
      } else {
        //Radio or CheckBox or Etc(Pass)
        if (obj.isMultySelect === true) {
          //CheckBox
          requestValue[prop] = [];
          requestText[prop] = [];
          //requestDisplayText[prop] = [];
          for (let val in obj) {
            let o = obj[val];
            if (o.childElementCount > 0 && o.firstElementChild.type === 'checkbox') {
              if (o.firstElementChild.checked) {
                requestValue[prop].push(val);
                requestText[prop].push(o.innerText);
                //requestDisplayText[prop].push(!displaytext ? o.displaytext[this.languageType] || displaytext[0] : '');
                //requestDisplayText[prop].push(o.innerText);
              }
            }
          }
        } else if (obj.isMultySelect === false) {
          //Radio
          requestValue[prop] = '';
          requestText[prop] = '';
          for (let val in obj) {
            let o = obj[val];
            if (o.childElementCount > 0 && o.firstElementChild.type === 'radio') {
              if (o.firstElementChild.checked) {
                requestValue[prop] = val;
                requestText[prop] = o.innerText;
                //requestDisplayText[prop] = !displaytext ? o.displaytext[this.languageType] || displaytext[0] : ''; 2021.1.6 displaytext undefined오류 수정
                //requestDisplayText[prop] = o.innerText;
                break;
              }
            }
          }
        } else {
          //Etc
          console.debug('ETC : '+typeof obj);
          if(typeof obj === 'string' || (obj !== undefined && obj.used)){
            requestValue[prop] = typeof obj === 'string' ? obj : ''; //TODO
            if (datepickerid && datepickerid.findIndex(item => item === prop) > -1) {
              requestText[prop] = typeof obj === 'string' ? obj : '';
              //requestDisplayText[prop] = typeof obj === 'string' ? obj : '';
            } else if (datetimepickerid && datetimepickerid.findIndex(item => item === prop) > -1) {
              requestText[prop] = typeof obj === 'string' ? obj : '';
              //requestDisplayText[prop] = typeof obj === 'string' ? obj : '';
            } else {
              requestText[prop] = text ? text[this.languageType] || text[0] : '';
              //requestDisplayText[prop] = text ? text[this.languageType] || text[0] : '';
            }
          }
        }
      }
    }

    let processSet = undefined;

    if (this.richnotification.content[richIdx].process) {
      processSet = { ...this.richnotification.content[richIdx].process };
      let { callbacktype, callbackaddress, session, mandatory, requestid } = processSet;
      let _this = this;

      if (mandatory instanceof Array && mandatory.length > 0) {
        let alertMsg = '';
        for (let idx = 0; idx < mandatory.length; idx++) {
          let m = mandatory[idx];
          if (this.richOptionData[richIdx][m.processid].active && (requestValue[m.processid] === undefined || requestValue[m.processid].length < 1)) {
            alertMsg += '\n' + m.alertmsg[this.languageType];
          }
        }
        if (alertMsg) {
          alert(alertMsg); //TODO
          return;
        }
      }
      let unusedProps = ['mandatory', 'requestid', 'processtype', 'summary'];
      unusedProps.forEach(props => {
        delete processSet[props];
      });
    }

    if (this.richOptionData && this.richOptionData[richIdx]) {
      let alertMsg = '';
      for (let prop in this.richOptionData[richIdx]) {
        if (
          this.richOptionData[richIdx][prop] &&
          this.richOptionData[richIdx][prop].minlength &&
          this.richOptionData[richIdx][prop].minlength > 0 &&
          this.richOptionData[richIdx][prop].active
        ) {
          if (requestValue[prop].length < this.richOptionData[richIdx][prop].minlength) {
            alertMsg += '\n' + this.richOptionData[richIdx][prop].validmsg;
          }
        }
      }
      if (alertMsg) {
        alert(alertMsg); //TODO
        return;
      }
    }

    if (confirmmsg && confirmmsg.length > 0 && confirmmsg[this.languageType].length > 0) {
      if (!confirm(confirmmsg[this.languageType])) return;
    }

    // let str = '확인';
    let resultdata = [];
    for (let props in requestValue) {
      // str += '\n' + props + ' : ' + requestValue[props];
      let textProps = {};
      let textDisplayProps = {};
      if (
        props.toLowerCase() !== 'cubechannelid' &&
        props.toLowerCase() !== 'cubemessageid' &&
        props.toLowerCase() !== 'cubelanguagetype' &&
        props.toLowerCase() !== 'cubeaccountid' &&
        props.toLowerCase() !== 'cubeuniquename'
      )
        textProps = { text: requestText[props] instanceof Array ? requestText[props] : [requestText[props]] };
        //textDisplayProps = { displaytext: requestDisplayText[props] instanceof Array ? requestDisplayText[props] : [requestDisplayText[props]] };
        
      resultdata.push({
        requestid: props,
        value: requestValue[props] instanceof Array ? requestValue[props] : [requestValue[props]],
        //displaytext: requestValue[props] instanceof Array ? requestValue[props] : [requestValue[props]],
        ...textProps
        //...textDisplayProps
      });
    }

    let tempHeader = this.richnotification.header;
    let childHeader = this.richnotification.content[richIdx].header;

    if (childHeader && Object.keys(childHeader).length > 0) {
      tempHeader = childHeader;
    }

    let profile = Store.getStore().getState().profile.profile;
    let msg = {
      header: {
        from: {
          username: profile.nameLang,
          uniquename: global.CONFIG.login.uniquename,
          channelid: this.props.message.channel_id,
          messageid: this.props.message.message_id,
          companycode: profile.companyCode
        },
        to: tempHeader.from
      },
      result: { resultdata: resultdata }
    };

    if (processSet) {
      msg.process = processSet;
    }

    let ret = { richnotificationmessage: msg };

    let target = event.target;
    let other = target.parentElement.parentElement.parentElement.querySelectorAll('input[type=button]');
    for (let i = 0; i < other.length; i++) {
      other[i].disabled = true;
      // other[i].style.backgroundColor = '#d4d4d4';
    }
    // target.className = 'richbutton active';
    // target.style.backgroundColor = '#ee909a';

    Socket.getApi()
      .apiRichNotificationResponse(ret)
      .then(res => {
        if (res.result) {
          // console.log('OK');
          // console.log(res);
          Store.getStore().dispatch(Actions.updateMessage(this.props.message.message_id, 'rnanswer', { result: msg.result }));
        } else {
          // target.className = 'richbutton';
          for (let i = 0; i < other.length; i++) {
            other[i].disabled = false;
          }
        }
      });

    // console.log(ret);//TODO
    // alert(str);
  };

  botProcess = (event, { header, process }, isContentClick) => {
    if (isContentClick) {
      let tempHeader = this.richnotification.header;
      let childHeader = header;

      if (childHeader && Object.keys(childHeader).length > 0) {
        tempHeader = childHeader;
      }
      process.processmulti = 'Y';
      let profile = Store.getStore().getState().profile.profile;
      let msg = {
        header: {
          from: {
            username: profile.nameLang,
            uniquename: global.CONFIG.login.uniquename,
            channelid: this.props.message.channel_id,
            messageid: this.props.message.message_id,
            companycode: profile.companyCode
          },
          to: tempHeader.from
        },
        result: { resultdata: [] },
        process: process
      };
      let ret = { richnotificationmessage: msg };
      Socket.getApi().apiRichNotificationResponse(ret);
    }
  };

  errorHandler(e) {
    e.target.setAttribute('src', global.CONFIG.photo.error);
  }
}

RichNotificationItem.defaultProps = defaultProps;

export default RichNotificationItem;
