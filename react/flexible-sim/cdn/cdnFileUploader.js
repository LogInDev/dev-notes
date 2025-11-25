// components/common/CdnFileUploader.js
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  uploadFileToCdn,
  deleteFileFromCdn,
  getThumbUrl,
  getDownloadUrl,
} from 'util/cdnClient';

class CdnFileUploader extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedFile: null,
      uploading: false,
      deleting: false,
      uploadedInfo: null, // CDN 응답 전체 저장
      error: null,
    };

    this.fileInputRef = React.createRef();
    this.handleFileChange = this.handleFileChange.bind(this);
    this.handleUploadClick = this.handleUploadClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);

    this._isMounted = false; // unmount 후 setState 방지
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  setSafeState(nextState) {
    if (this._isMounted) {
      this.setState(nextState);
    }
  }

  getEmpNo() {
    // 우선 순위: props.empNo > global.CONFIG.empNo
    const { empNo } = this.props;
    if (empNo) return empNo;
    if (global && global.CONFIG && global.CONFIG.empNo) {
      return global.CONFIG.empNo;
    }
    return '';
  }

  getCdnKey() {
    // 우선 순위: props.cdnKey > global.CONFIG.cdnKey
    const { cdnKey } = this.props;
    if (cdnKey) return cdnKey;
    if (global && global.CONFIG && global.CONFIG.cdnKey) {
      return global.CONFIG.cdnKey;
    }
    return '';
  }

  handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    this.setSafeState({
      selectedFile: file || null,
      error: null,
    });
  }

  handleUploadClick() {
    const { selectedFile } = this.state;
    const empNo = this.getEmpNo();
    const key = this.getCdnKey();

    if (!selectedFile) {
      this.setSafeState({ error: '업로드할 파일을 선택해 주세요.' });
      return;
    }
    if (!empNo || !key) {
      this.setSafeState({ error: 'empNo 또는 cdnKey 설정이 없습니다.' });
      return;
    }

    this.setSafeState({ uploading: true, error: null });

    uploadFileToCdn(selectedFile, { key, empNo })
      .then(json => {
        this.setSafeState({
          uploading: false,
          uploadedInfo: json,
        });

        // 필요하면 부모로도 알려줌
        if (typeof this.props.onUploadSuccess === 'function') {
          this.props.onUploadSuccess(json);
        }
      })
      .catch(err => {
        this.setSafeState({
          uploading: false,
          error: err && err.message ? err.message : '업로드 중 오류가 발생했습니다.',
        });
      });
  }

  handleDeleteClick() {
    const { uploadedInfo } = this.state;
    const empNo = this.getEmpNo();
    const key = this.getCdnKey();

    if (!uploadedInfo || !uploadedInfo.seq) {
      this.setSafeState({ error: '삭제할 파일이 없습니다.' });
      return;
    }

    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    this.setSafeState({ deleting: true, error: null });

    deleteFileFromCdn({
      seq: uploadedInfo.seq,
      empNo: empNo,
      key: key,
    })
      .then(json => {
        // 삭제 성공
        this.setSafeState({
          deleting: false,
          uploadedInfo: null,
          selectedFile: null,
        });

        if (this.fileInputRef.current) {
          this.fileInputRef.current.value = '';
        }

        if (typeof this.props.onDeleteSuccess === 'function') {
          this.props.onDeleteSuccess(json);
        }
      })
      .catch(err => {
        this.setSafeState({
          deleting: false,
          error: err && err.message ? err.message : '삭제 중 오류가 발생했습니다.',
        });
      });
  }

  renderUploadedInfo() {
    const { uploadedInfo } = this.state;
    if (!uploadedInfo) return null;

    const thumbUrl = uploadedInfo.seq
      ? getThumbUrl(uploadedInfo.seq, '300x0')
      : uploadedInfo.link; // 응답에 link가 있으면 그대로 사용 가능
    const downloadUrl = uploadedInfo.down || getDownloadUrl(uploadedInfo.seq);

    return (
      <div className="cdn-uploaded-info" style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>파일명:</strong> {uploadedInfo.fileName} ({uploadedInfo.fileExt}) /{' '}
          {uploadedInfo.fileSize} bytes
        </div>

        {/* 이미지인 경우 썸네일 표시 (fileType === 2가 이미지) */}
        {uploadedInfo.fileType === 2 && thumbUrl && (
          <div style={{ marginBottom: 8 }}>
            <img
              src={thumbUrl}
              alt={uploadedInfo.fileName}
              style={{ maxWidth: 200, maxHeight: 200, display: 'block' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            다운로드
          </a>
          <button
            type="button"
            onClick={this.handleDeleteClick}
            disabled={this.state.deleting}
          >
            {this.state.deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    );
  }

  render() {
    const { uploading, error } = this.state;

    return (
      <div className="cdn-file-uploader">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="file"
            ref={this.fileInputRef}
            onChange={this.handleFileChange}
          />
          <button
            type="button"
            onClick={this.handleUploadClick}
            disabled={uploading}
          >
            {uploading ? '업로드 중...' : '업로드'}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 8, color: 'red' }}>
            {error}
          </div>
        )}

        {this.renderUploadedInfo()}
      </div>
    );
  }
}

CdnFileUploader.propTypes = {
  empNo: PropTypes.string,     // 없으면 global.CONFIG.empNo 사용
  cdnKey: PropTypes.string,    // 없으면 global.CONFIG.cdnKey 사용
  onUploadSuccess: PropTypes.func,
  onDeleteSuccess: PropTypes.func,
};

export default CdnFileUploader;