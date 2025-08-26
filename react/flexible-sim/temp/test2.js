renderControl(col, key, idx) {
    let { type, control } = col;
    let { align, width, height, bgcolor, textcolor, placeholder, popupoption, active, maxlength, minlength, validmsg, processid, color } = control;
    let cssProps = {};
    let innerProps = {};
    let lCssProps = {};
    let _this = this;

    if (processid) {
      this.richOptionData[idx] = { ...this.richOptionData[idx], [processid]: { active: active !== undefined ? active : true } };
    }

    if (minlength && minlength > 0) {
      this.richOptionData[idx][processid].minlength = minlength;
      this.richOptionData[idx][processid].validmsg = validmsg[this.languageType];
    }

    if (typeof align === 'string' && align.trim()) {
      cssProps = { textAlign: align.toLowerCase() };
    }
    if (typeof width === 'string' && width.trim()) {
      cssProps = { ...cssProps, width: width.indexOf('%') === -1 && width.toLowerCase().indexOf('px') === -1 ? width.toLowerCase() + '%' : width.toLowerCase() };
    }
    if (typeof bgcolor === 'string' && bgcolor.trim()) {
      cssProps = { ...cssProps, backgroundColor: bgcolor.toLowerCase() };
    }
    if (typeof textcolor === 'string' && textcolor.trim()) {
      cssProps = { ...cssProps, color: textcolor.toLowerCase() };
    }
    if (typeof color === 'string' && color.trim()) {
      cssProps = { ...cssProps, color: color.toLowerCase() };
    }

    let itemProps = { style: cssProps, key: key };
    if (placeholder instanceof Array && placeholder.length > 0) {
      itemProps = { ...itemProps, placeholder: placeholder[this.languageType] };
    }

    if (typeof maxlength === 'number' && maxlength > 0) {
      itemProps.maxLength = maxlength + '';
    }

    if (type === 'button') itemProps.className = 'richbutton';
    if (control.text && control.text[this.languageType]) lCssProps = { style: { paddingRight: '10px' } };

    let answer = false;
    if (this.answer.result && this.answer.result.resultdata) {
      let resultdata = this.answer.result.resultdata;
      let answer_idx = resultdata.findIndex(row => row.requestid === control.processid);
      if (answer_idx > -1) answer = resultdata[answer_idx].value || false;
      if (type !== 'button' && answer) this.globalAnswer = answer;
    }

    if (this.toUniqueName instanceof Array) {
      itemProps.disabled = true;
      innerProps.disabled = true;
      this.toUniqueName.forEach(item => {
        if (item === global.CONFIG.login.uniquename || item === 'ALL') {          
          itemProps.disabled = false;
          innerProps.disabled = false;
          if (itemProps.className) itemProps.className.replace('active', '');
        }
      });
    } else if (this.toUniqueName instanceof String) {
      if (this.toUniqueName === global.CONFIG.login.uniquename || this.toUniqueName === 'ALL') {        
        itemProps.disabled = false;
        innerProps.disabled = false;
        if (itemProps.className) itemProps.className.replace('active', '');
      }
    }

    if (this.isBot) {
      itemProps.disabled = true;
      innerProps.disabled = true;
    } else if (answer) {
      itemProps.disabled = true;
      innerProps.disabled = true;
      if (answer instanceof Array && answer.length > 1) {
        // itemProps.checked = answer.findIndex(v => v + '' === control.value) > -1;
        innerProps.checked = answer.findIndex(v => v + '' === control.value) > -1;
      } else if (answer) {
        if (type === 'radio') {
          // itemProps.checked = answer[0] === control.value;
          innerProps.checked = answer[0] === control.value;
        } else if (type === 'button') {
          if (answer[0] === control.value) itemProps.className = 'richbutton active';
          else itemProps.className = 'richbutton';
        } else {
          itemProps.defaultValue = answer[0];
        }
      }
    } else if (control.processid && this.requestObj[idx] && this.requestObj[idx][control.processid]) {
      itemProps.ref = ref => {
        if (ref) {
          this.requestObj[idx][control.processid].used = true;
          if (type === 'checkbox' || type === 'radio') {
            this.requestObj[idx][control.processid].isMultySelect = type === 'checkbox';
            this.requestObj[idx][control.processid][control.value] = ref;
            this.requestObj[idx][control.processid][control.value].displaytext = control.displaytext; // displaytext 추가
          } else {
            this.requestObj[idx][control.processid] = ref;
          }
        }
      };

      if (type === 'datepicker') {
        this.datepickerid = {};
        if (this.datepickerid && this.datepickerid[idx]) {
          let dptemp = this.datepickerid[idx];
          if (dptemp.length > 0 && dptemp.split('|').findIndex(item => item === control.processid) < 0) this.datepickerid[idx] = dptemp + '|' + control.processid;
        } else this.datepickerid[idx] = control.processid;
      }
      if (type === 'datetimepicker') {
        this.datetimepickerid = {};
        if (this.datetimepickerid && this.datetimepickerid[idx]) {
          let dptemp = this.datetimepickerid[idx];
          if (dptemp.length > 0 && dptemp.split('|').findIndex(item => item === control.processid) < 0) this.datetimepickerid[idx] = dptemp + '|' + control.processid;
        } else this.datetimepickerid[idx] = control.processid;
      }
    } else if (this.globalAnswer && type === 'button') {
      // itemProps.className = 'richbutton active';
      itemProps.disabled = true;
      innerProps.disabled = true;
    }

    if (control.linkurl || control.clickurl) {
      let url = control.linkurl || control.clickurl;
      // if (this.isBot) itemProps.disabled = true;
      // else itemProps.disabled = false;

      if (url.indexOf('@invite:') > -1) {
        itemProps.onClick = () => {
          let api = Socket.getApi();
          api.addDMChannelByUniqueName(url.split(':')[1].trim());
        };
      } else {
        itemProps.onClick = () => {
          window.open(url, this.props.message.message_id + '_popup', typeof popupoption === 'string' && popupoption.trim() ? popupoption.trim() : ''); //TODO
        };
      }

      if (type === 'image') itemProps.style.cursor = 'pointer';
    }

    if (typeof active === 'boolean' && active === false) {
      itemProps.disabled = true;
      innerProps.disabled = true;
    }

    let innerText = control.text ? control.text[this.languageType] || control.text[0] : '';
    let displaytext = control.displaytext ? control.displaytext[this.languageType] || control.displaytext[0] : '';
    switch (type) {
      case 'inputtext':
        return [
          <label {...lCssProps} key={key + 'l'}>
            {innerText}
          </label>,
          <input type="text" defaultValue={control.value} {...itemProps} />
        ];
      case 'textarea':
        if (!itemProps.style.width) itemProps.style.width = '400px';
        // if (!itemProps.style.height) itemProps.style.height = '100px';
        if (typeof height === 'string' && height.trim()) {
          itemProps.rows = height
            .trim()
            .toLowerCase()
            .replace('%', '')
            .replace('px', '');
        } else itemProps.rows = '3';

        return [
          <label {...lCssProps} key={key + 'l'}>
            {innerText}
          </label>,
          <textarea defaultValue={control.value} {...itemProps} />
        ];
      case 'radio':
      case 'checkbox':
        let name = this.props.message.message_id + '_' + control.processid;
        let uniqueID = name + '_' + control.value;
        return [
          // <input {...itemProps} id={uniqueID} type={type.toLowerCase()} name={name} value={control.value} defaultChecked={control.checked} />,
          // <label htmlFor={uniqueID}>{control.text[this.languageType]}</label>
          <label {...itemProps} className={'rich' + type}>
            <input id={uniqueID} type={type.toLowerCase()} name={name} value={control.value} defaultChecked={control.checked} {...innerProps} />
            <span className="checkmark" />
            {innerText}
          </label>
        ];
      case 'button':
        if (itemProps.className.indexOf('active') > -1) {
          itemProps.style.backgroundColor = '#eeeeee';
          itemProps.style.color = '#313131';
          itemProps.style.border = '1px solid #b2b2b2';
        } else if (itemProps.disabled) {
          itemProps.style.backgroundColor = '#ffffff';
          itemProps.style.color = '#b2b2b2';
          itemProps.style.border = '1px solid #b2b2b2';
        }
        return (
          <input
            onClick={event => {
              this.confirmProcess(event, control, idx);
            }}
            {...itemProps}
            type="button"
            value={innerText}
          />
        );
      case 'label':
        return <span {...itemProps}>{this.renderMarkdown(innerText)}</span>; /*<label key={key + 'l'}>{Control.text[this.languageType]}</label>;*/
      case 'select':
        let items = control.item.map((item, i) => {
          let selectText = item.text[this.languageType] || item.text[0];
          item.selected ? itemProps.defaultValue === item.value : false;
          return (
            <option key={key + control.processid + i} value={item.value}>
              {selectText}
            </option>
          );
        });
        return [
          <label {...lCssProps} key={key + 'l'}>
            {innerText}
          </label>,
          <select {...itemProps}>{items}</select>
        ];
      case 'image':
        let { image } = global.CONFIG.resource;
        image += '/rich/noimg.png';
        if (typeof height === 'string' && height.trim()) {
          itemProps.height = height.trim();
        }
        return (
          <img
            className="richimage"
            {...itemProps}
            src={control.sourceurl}
            onError={e => {
              e.target.src = image;
              e.target.style.width = '';
            }}
            title={innerText}
          />
        );
      case 'hypertext':
        if (!itemProps.style.color) itemProps.style.color = '#094c8f';
        if (!itemProps.disabled) return <a {...itemProps}>{innerText}</a>;
        else return innerText;
      case 'datepicker':
        let name_datepicker = this.props.message.message_id + '_' + control.processid;
        let uniqueID_datepicker = name_datepicker + '_' + key;
        delete itemProps.ref;
       
        let datepickervalue = control.value;
        if (itemProps.disabled) datepickervalue = itemProps.defaultValue;
        return [
          <label {...lCssProps} key={key + '1'}>
            {innerText}
          </label>,
          <DatePicker
            ref={uniqueID_datepicker}
            {...itemProps}
            // disabled={!this.state.checkDueDate}
            dateFormat={this.dateFormat}
            // minDate={moment()}
            selected={this.getSelectedDate(control.processid, datepickervalue, idx)}
            onChange={this.onChangeDate(control.processid, idx)}
          />,
          <a
            onClick={() => {
              this.refs[uniqueID_datepicker].onInputClick();
            }}
          >
            <i className="icon-calendar" />
          </a>
        ];
        case 'datetimepicker':
        let name_datetimepicker = this.props.message.message_id + '_' + control.processid;
        let uniqueID_datetimepicker = name_datetimepicker+'_date' + '_' + key;
        let uniqueID_timepicker = name_datetimepicker+'_time' + '_' + key;
        delete itemProps.ref;
        let datetime = moment(new Date(control.value));//.format('YYYY/MM/DD h:mm:ss a');
        let date =moment(new Date(control.value)).format('YYYY/MM/DD');
        if (itemProps.disabled){
          date = itemProps.defaultValue;
          //itemProps.style.backgroundColor='#ebebe4';
        }
        //itemProps.style.marginLeft= '10px';
        return [
          <label {...lCssProps} key={key + '1'}>
            {innerText}
          </label>,
          <DatePicker
            ref={uniqueID_datetimepicker}
            {...itemProps}
            // disabled={!this.state.checkDueDate}
            dateFormat={this.dateFormat}
            //minDate={moment()}
            selected={this.getSelectedDateTime(control.processid, date, idx)}
            onChange={this.onChangeDateTime(control.processid,idx)}
          />,
          <a
            onClick={() => {
              this.refs[uniqueID_datetimepicker].onInputClick();
            }}
          >
            <i className="icon-calendar" />
          </a>
          ,<TimePicker 
             disabled={itemProps.disabled}//style={{marginLeft: '10px'}}
             {...itemProps.style}
             showSecond={false} 
             value={this.getSelectedTime(control.processid, datetime, idx)} 
             onChange={this.onChangeTime(control.processid,idx)} 
             format={'h:mm a'} use12Hours />

        ];       
        case 'container':
        return this.renderContainer(control.containeritem, key, idx);
      case 'list':
        return this.renderList(control, key, idx);
      default:
        return false;
    }
  }

  renderContainer(container, key, idx) {
    return (
      <div key={key} className="richcontainer">
        {container.map((item, _idx) => {
          return (
            <div className="richcontainerrow">
              {item.itemcolumn.map((ic, _idx2) => {
                return this.renderColumn(ic, key + '_' + _idx + '_' + _idx2, idx);
              })}
            </div>
          );
        })}
      </div>
    );
  }
