// 예: AssistantView / 어떤 Form 컴포넌트 안에서
import React, { Component } from 'react';
import CdnFileUploader from 'components/common/CdnFileUploader';

class SomeView extends Component {
  render() {
    return (
      <div>
        <h3>파일 첨부</h3>
        <CdnFileUploader
          // cube라면 보통 global.CONFIG에서 꺼내 쓰겠지만,
          // 필요하면 이렇게 명시적으로 넘겨도 됨
          empNo={global.CONFIG && global.CONFIG.empNo}
          cdnKey={global.CONFIG && global.CONFIG.cdnKey}
          onUploadSuccess={(info) => {
            // info.seq, info.down 등을 Redux나 Form 값에 넣어두면 됨
            console.log('업로드 성공:', info);
          }}
          onDeleteSuccess={(info) => {
            console.log('삭제 성공:', info);
          }}
        />
      </div>
    );
  }
}

export default SomeView;