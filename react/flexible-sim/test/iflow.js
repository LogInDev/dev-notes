import React, { Component } from 'react';
import jquery from 'jquery'; // 이미 전역 $ 쓰면 이건 빼도 됨

class RichNotificationItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loadingIflow: false,
    };

    this.handleClickIflow = this.handleClickIflow.bind(this);
    this.buildMarkdownFromRichnotification = this.buildMarkdownFromRichnotification.bind(this);
  }

  /**
   * richnotification → 마크다운 문자열로 변환
   * 프로젝트 JSON 스펙에 맞게 여기만 실제 로직으로 바꿔주면 됨
   */
  buildMarkdownFromRichnotification(richnotification) {
    if (!richnotification) return '';

    // 1) 이미 문자열이면 그대로 사용
    if (typeof richnotification === 'string') {
      return richnotification;
    }

    // 2) 이미 markdown 필드가 있다면 그거 사용
    if (richnotification.markdown) {
      return richnotification.markdown;
    }

    // 3) 그 외에 list/rows/... 구조라면 여기서 마크다운 조합
    //    (예시는 그냥 title + body 합치는 형태)
    let lines = [];

    if (richnotification.title) {
      lines.push(`# ${richnotification.title}`);
      lines.push(''); // 빈 줄
    }

    if (richnotification.body) {
      lines.push(richnotification.body);
    }

    if (Array.isArray(richnotification.list)) {
      lines.push('');
      richnotification.list.forEach(item => {
        if (item && item.text) {
          lines.push(`- ${item.text}`);
        }
      });
    }

    return lines.join('\n');
  }

  /**
   * iFlow 임시글 생성 API 호출
   * - Request
   *   Query: token (필수)
   *   Body: { empNo, title, contType, content }
   * - Response
   *   { tempArSeq, empNo, iflowUrl }
   */
  handleClickIflow() {
    const richnotification = this.richnotification; // 이미 이 컴포넌트에 세팅해놨다고 가정
    if (!richnotification) {
      alert('보낼 richnotification 데이터가 없습니다.');
      return;
    }

    // 1) 토큰/사번/제목 세팅
    const token = global.CONFIG.iflowToken || '';  // 토큰 저장 위치에 맞게 수정
    const empNo = global.CONFIG.empNo || global.CONFIG.empno || ''; // 사번
    const title =
      richnotification.title ||
      '[Cube AI] 임시 글'; // 제목 없을 때 기본 타이틀

    // 2) richnotification → 마크다운 본문
    const content = this.buildMarkdownFromRichnotification(richnotification);

    if (!token) {
      console.error('iFlow token 누락');
      alert('iFlow 토큰 정보가 없습니다. 관리자에게 문의해주세요.');
      return;
    }
    if (!empNo) {
      console.error('empNo 누락');
      alert('사번 정보를 찾을 수 없습니다.');
      return;
    }

    const body = {
      empNo: empNo,    // String, Y
      title: title,    // String, Y
      contType: 1,     // Number, Y (1: markdown, 0: html)
      content: content // String, Y
    };

    // 3) API URL (개발/운영 구분은 global.CONFIG 등으로 분기해도 됨)
    const baseUrl = 'http://iflowdev.skhynix.com'; // 운영이면 iflow.skhynix.com 등으로 변경
    const url = `${baseUrl}/api/itf/v2/portalInterface/temp/article_post?token=${encodeURIComponent(
      token
    )}`;

    this.setState({ loadingIflow: true });

    jquery.ajax({
      url: url,
      method: 'POST',
      contentType: 'application/json;charset=UTF-8',
      data: JSON.stringify(body),
      success: (res) => {
        this.setState({ loadingIflow: false });

        let data = res;
        if (typeof res === 'string') {
          try {
            data = JSON.parse(res);
          } catch (e) {
            console.warn('iFlow 응답 JSON 파싱 실패, 원본 사용', e);
          }
        }

        if (!data || !data.iflowUrl) {
          console.error('iFlow 응답에 iflowUrl 없음', data);
          alert('iFlow 임시 글 URL을 받지 못했습니다.');
          return;
        }

        // 4) 응답 URL 새 탭으로 오픈
        window.open(data.iflowUrl, '_blank');
      },
      error: (xhr, status, err) => {
        this.setState({ loadingIflow: false });
        console.error('iFlow 임시글 생성 오류:', status, err, xhr.responseText);
        alert('iFlow 임시 글 생성 중 오류가 발생했습니다.');
      },
    });
  }

  render() {
    const { loadingIflow } = this.state;
    const imageBase = global.CONFIG.imageBase || '';

    const renderIflow = (
      <button
        className="etcBtn newImg"
        type="button"
        onClick={this.handleClickIflow}
        disabled={loadingIflow}
      >
        <img src={`${imageBase}/aiassistant/blog_ico.png`} alt="iflow" />
      </button>
    );

    return (
      <div className="some-wrap">
        {/* ... 다른 내용 */}
        {renderIflow}
      </div>
    );
  }
}

export default RichNotificationItem;