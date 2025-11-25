// util/cdnClient.js
// CDN 업로드/삭제/썸네일/다운로드 URL 유틸

const CDN_BASE_URL = 'https://cdn.skhynix.com';
const CDN_DEV_BASE_URL = 'https://cdndev.skhynix.com'; // 암호화 API용 (필요 시)

// 공통: 응답 JSON 체크
function handleJsonResponse(response) {
  if (!response.ok) {
    return response.text().then(text => {
      throw new Error(text || ('HTTP Error: ' + response.status));
    });
  }
  return response.json();
}

/**
 * 단일 파일 업로드
 * @param {File} file - input[type=file]에서 선택한 파일 객체
 * @param {Object} options
 * @param {string} options.key - 시스템으로부터 발급받은 Key
 * @param {string} options.empNo - 사번
 * @returns {Promise<Object>} CDN 응답(JSON)
 *
 * 응답 예:
 * {
 *   code: 300,
 *   seq: "6167D87B65BC924DA6E33DA4042D6D68",
 *   originalSeq: "74434",
 *   fileName: "2015107175437_423.jpg",
 *   fileType: 2,
 *   size: 170375,
 *   fileSize: 170375,
 *   fileExt: "jpg",
 *   link: "https://cdn.skhynix.com/img/thumb/200x200/6167D87B65BC924DA6E33DA4042D6D68",
 *   down: "https://cdn.skhynix.com/down/file/6167D87B65BC924DA6E33DA4042D6D68"
 * }
 */
export function uploadFileToCdn(file, { key, empNo }) {
  if (!file) {
    return Promise.reject(new Error('업로드할 파일이 없습니다.'));
  }
  if (!key || !empNo) {
    return Promise.reject(new Error('CDN key 또는 empNo가 없습니다.'));
  }

  const formData = new FormData();
  // 스펙: Multipart 로 업로드 하는 파일 오브젝트 이름은 fileObject
  formData.append('fileObject', file);

  const query = [
    'key=' + encodeURIComponent(key),
    'empNo=' + encodeURIComponent(empNo),
  ].join('&');

  const url = CDN_BASE_URL + '/api/pub/v1/upload?' + query;

  return fetch(url, {
    method: 'POST',
    body: formData,
    credentials: 'include', // SSO 세션 쿠키 필요할 수 있어서
  }).then(handleJsonResponse).then(json => {
    if (json.code !== 300) {
      throw new Error('CDN 업로드 실패 (code=' + json.code + ')');
    }
    return json;
  });
}

/**
 * 파일 삭제
 * @param {Object} params
 * @param {string} params.seq   - 암호화된 파일 고유 번호
 * @param {string} params.empNo - 삭제요청자 사번
 * @param {string} params.key   - 업로드 시 사용한 key
 */
export function deleteFileFromCdn({ seq, empNo, key }) {
  if (!seq || !empNo || !key) {
    return Promise.reject(new Error('seq, empNo, key는 필수입니다.'));
  }

  const url = CDN_BASE_URL + '/api/pub/v1/upload/del/seq';

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    body: JSON.stringify({ seq, empNo, key }),
    credentials: 'include', // SSO 세션 유지
  }).then(handleJsonResponse).then(json => {
    if (json.code !== 300) {
      throw new Error('CDN 삭제 실패 (code=' + json.code + ')');
    }
    return json;
  });
}

/**
 * 다운로드 URL 생성
 * - 보통 응답의 down 필드 그대로 써도 되지만 seq만 있을 때용
 */
export function getDownloadUrl(seq) {
  if (!seq) return '';
  return CDN_BASE_URL + '/api/pub/v1/down/file/' + encodeURIComponent(seq);
}

/**
 * 썸네일 이미지 URL 생성
 * size: "300x0", "0x300", "300x200", "0x0" 등
 */
export function getThumbUrl(seq, size) {
  if (!seq) return '';
  const safeSize = size || '300x0';
  return CDN_BASE_URL + '/img/thumb/' + safeSize + '/' + encodeURIComponent(seq);
}

/**
 * (선택) 파일 ID 암호화 API
 * 실제 운영에서는 dev 도메인/운영 도메인 따로 있을 수 있음
 */
export function encryptFileId(originalId) {
  if (!originalId) {
    return Promise.reject(new Error('originalId가 없습니다.'));
  }
  const url = CDN_DEV_BASE_URL + '/edit/crypto/encrypt/' + encodeURIComponent(originalId);

  return fetch(url, {
    method: 'GET',
    credentials: 'include',
  }).then(handleJsonResponse).then(json => {
    if (json.code !== 300) {
      throw new Error('파일 ID 암호화 실패 (code=' + json.code + ')');
    }
    return json;
  });
}