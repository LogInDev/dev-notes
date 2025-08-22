import React, { Component } from 'react';
import * as Store from 'GlobalStore';
import * as Socket from '../../socket';
import slimscroll from 'slimscroll';

class MailPopup extends Component{
  constructor(props) {
    super(props);

    this.state = {
      detail:undefined
    }

  }

  componentDidMount(){
  this.slimscroll = new slimscroll({
    height: '100%',
    idSelector: '#mailcontent',
  });
  this.slimscroll.init();
  }

  componentWillReceiveProps(nextProps) {
   if(this.props.maildetail !== nextProps.maildetail) {
     let detail = nextProps.maildetail;
     this.setState({...this.state, detail:detail});
   }
  }

  onReply() {

    let profile = Store.getProfile();
    let { companyCode, subCompanyCode } = profile;
    let uid = this.state.detail.uid;
    let legacyInfo = global.CONFIG.legacy.getLegacyInfo('MAIL_VIEW', this.props.sub ? subCompanyCode : companyCode );
    let url = "http://email.skhynix.com/WOW/MailA/Message/AddNewMessage.aspx?a=Reply&id=" + uid;

    window.open(url, 'Mail', 'width=860, height=740,toolbar=no,status=no,menubar=no,scrollbars=yes, resizable=yes, location=no');
  }

  onReplyall() {

    let profile = Store.getProfile();
    let { companyCode, subCompanyCode } = profile;
    let uid = this.state.detail.uid;
    let legacyInfo = global.CONFIG.legacy.getLegacyInfo('MAIL_VIEW', this.props.sub ? subCompanyCode : companyCode );
    let url = "http://email.skhynix.com/WOW/MailA/Message/AddNewMessage.aspx?a=ReplyAll&id=" + uid;

    window.open(url, 'Mail', 'width=860, height=740,toolbar=no,status=no,menubar=no,scrollbars=yes, resizable=yes, location=no');
  }

  Forward() {

    let profile = Store.getProfile();
    let { companyCode, subCompanyCode } = profile;
    let uid = this.state.detail.uid;
    let legacyInfo = global.CONFIG.legacy.getLegacyInfo('MAIL_VIEW', this.props.sub ? subCompanyCode : companyCode );
    let url = "http://email.skhynix.com/WOW/MailA/Message/AddNewMessage.aspx?a=Forward&id=" + uid;

    window.open(url, 'Mail', 'width=860, height=740,toolbar=no,status=no,menubar=no,scrollbars=yes, resizable=yes, location=no');
  }

  meeting() {

    let profile = Store.getProfile();
    let { companyCode, subCompanyCode } = profile;
    let uid = this.state.detail.uid;
    let legacyInfo = global.CONFIG.legacy.getLegacyInfo('MAIL_VIEW', this.props.sub ? subCompanyCode : companyCode );
    let url = "http://email.skhynix.com/Schedule/AddSchedule.aspx?isNew=false&sType=meeting&messageid=" + uid;

    window.open(url, 'Mail', 'width=860, height=740,toolbar=no,status=no,menubar=no,scrollbars=yes, resizable=yes, location=no');
  }

  onPost() {

    let profile = Store.getProfile();
    let { companyCode, subCompanyCode, uniqueName, refUniqueName, nameLang, email, subEmail } = profile;
    let uid = this.state.detail.uid;
    let uniName = this.props.sub ? refUniqueName : uniqueName;
    let semail = this.props.sub? subEmail : email;
    let legacyInfo = global.CONFIG.legacy.getLegacyInfo('MAIL_VIEW', this.props.sub ? subCompanyCode : companyCode );
    let url = "http://email.skhynix.com/WOW/Mail/Message/PopupPost.aspx?type=post&senderac=" + uniName + "&sendernm=" + nameLang + "&senderem=" + semail + "&messageid=" + uid

    window.open(url, 'Mail', 'width=860, height=740,toolbar=no,status=no,menubar=no,scrollbars=yes, resizable=yes, location=no');
  }

  teamroom() {

    let profile = Store.getProfile();
    let { companyCode, subCompanyCode } = profile;
    let uid = this.state.detail.uid;
    let legacyInfo = global.CONFIG.legacy.getLegacyInfo('MAIL_VIEW', this.props.sub ? subCompanyCode : companyCode );
    let url = "http://email.skhynix.com/WOW/Mail/Message/PopupPost.aspx?type=teamroom&messageid=" + uid;

    window.open(url, 'Mail', 'width=860, height=740,toolbar=no,status=no,menubar=no,scrollbars=yes, resizable=yes, location=no');
  }

render() {
  let { image } = global.CONFIG.resource;
  let toRecipients = this.state.detail === undefined ? '' : this.state.detail[0].toRecipients;
  let fromName = this.state.detail === undefined ? '' : this.state.detail[0].fromName;
  let sentDate = this.state.detail === undefined ? '' : this.state.detail[0].sentDate;
  let subject = this.state.detail === undefined ? '' : this.state.detail[0].subject;
  let body = this.state.detail === undefined ? '' : this.state.detail[0].body.replace(']]>','');
  let attach = this.state.detail === undefined ? '' : this.state.detail[0].attachments;
  let list =[];
  let attlist = [];


 if(this.state.detail !== undefined ){
   toRecipients.map((item) => {
       list.push(item.name + "; ");
     });
 }

 if(this.state.detail !== undefined ){
   var ext ='';
   let fileicon='';
   attach.map((item) => {
      ext = item.name.split(".").pop().toLowerCase();
      fileicon = global.Common.getImageByExt(ext)
       attlist.push(<span><img src={fileicon} alt="" />{item.name}<br/></span>);
     });
 }

      //<button type='button' onClick={this.meeting.bind(this)} id='mailMain' title="모임요청" ><img src={ image + '/pop/btn_meet.png' } alt=""/></button>
  return(
    <div className='maillayer'>
    <div className='htit'>
      <span>메일 미리보기</span>
      <button type='button' className='btnclose' id='leftClose' onClick={this.props.closeModal}></button>
    </div>
    <div className = 'button'>
      <button type='button' className='btns btnOk' onClick={this.onReply.bind(this)} id='mailMain' title="회신" >회신</button>
      <button type='button' className='btns btnOk' onClick={this.onReplyall.bind(this)} id='mailWrite' title="전체 회신" >전체 회신</button>
      <button type='button' className='btns btnOk' onClick={this.Forward.bind(this)} id='mailSet' title="전달" >전달</button>
      <img style={{margin:"5px"}}src={ image + '/pop/h_line_List.gif' } alt=""/>
      <button type='button' onClick={this.onPost.bind(this)} id='mailWrite' title="Post 등록" ><img src={ image + '/pop/btn_post.png' } alt=""/></button>
      <button type='button' onClick={this.teamroom.bind(this)} id='mailSet' title="팀룸 보내기" ><img src={ image + '/pop/btn_send.png' } alt=""/></button>

    </div>
    <div className = 'text'>
      <table>
        <tr>
          <td className='subj'>보낸 사람</td>
          <td className='tex'>{fromName}</td>
        </tr>
        <tr>
          <td className='subj'>보낸 날짜</td>
          <td className='tex'>{sentDate}</td>
        </tr>
        <tr>
          <td className='subj'>받는 사람</td>
          <td className='tex'>{list}</td>
        </tr>
        <tr>
          <td className='subj'>제목</td>
          <td className='subtex'>{subject}</td>
        </tr>
        <tr>
          <td className='subj'>첨부파일</td>
          <td className='subtex'>{attlist}</td>
        </tr>
      </table>
        <div dangerouslySetInnerHTML={ {__html: body} } className='mailcontent' id='mailcontent'></div>
    </div>
  </div>
  )
}

}

export default MailPopup;
