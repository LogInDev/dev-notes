단일 파일 업로드 : 한개의 파일 업로드 시 사용
HTTP request( Method = POST-multipart 방식)
POST https://cdn.skhynix.com /api/pub/v1/upload

Query Parameter
Parameter 이름	타입	필수 여부	설     명
  key	String	Y	  시스템으로부터 발급받은 Key String
  empNo	String	Y	  사번 (SSO 인증 필요)
  -	fileObject	Y	  Multipart 로 업로드 하는 파일 오브젝트


Response
엘리먼트 명	Depth	배열 구분	설     명	 값 구분
  code	1	
  결과 코드	  완료 : 300
  에러 : 500
  down	1	
  다운로드 링크	
  fileExt	1	
  파일 확장자	
  fileName	1	
  파일명	
  fileSize	1	
  파일크기	
  fileType	1	
  파일형식	  기타 : 0
파일 : 1
  이미지 : 2
  link	1	
  썸네일이미지 링크	
  seq	1	
  암호화된 파일고유 번호	
  originalSeq	1	
  파일고유 번호	
  size	1	
  파일크기 (업로드 된 파일의 실제 용량)	

응답 샘플
 {  

   "code":300,

   "seq":"6167D87B65BC924DA6E33DA4042D6D68",

   "originalSeq":"74434",

   "fileName":"2015107175437_423.jpg",

   "fileType":2,

   "size":170375,

   "fileSize":170375,

   "fileExt":"jpg",

   // 일반 첨부일 경우 확장자의 아이콘 링크 반환



   "link":"https://cdn.skhynix.com/img/thumb/200x200/6167D87B65BC924DA6E33DA4042D6D68", 

   "down":"https://cdn.skhynix.com/down/file/6167D87B65BC924DA6E33DA4042D6D68"

}



파일 다운로드
HTTP request( Method = GET 방식)
GET https://cdn.skhynix.com /api/pub/v1/down/file/{id}
Query Parameter
Parameter 이름	타입	필수 여부	설     명
  id	String	Y	  암호화된 파일 고유 번호
  token	String	N	  시스템으로부터 발급받은 token String
  -	-	Y	  SSO 인증 상태에서만 다운로드 가능




파일 삭제
HTTP request( Method = POST 방식)
POST https://cdn.skhynix.com /api/pub/v1/upload/del/seq 
Parameter (body/json) 
Parameter 이름	타입	필수 여부	설     명
  seq	String	Y	  암호화된 파일 고유 번호
  empNo	String	Y	  삭제요청자 사번
  key	String	Y	  해당 업로드시 key 정보
요청 예시
 {

    "seq": "F1CA17FDE8F0835FC9C578BD0B70AFF5",

    "empNo": "I0100351",

    "key": "A/mvcUhlN9uasdfUDW1WU/DswfSTuasdf+Q="    

 }





썸네일 이미지 API
업로드 된 이미지로 썸네일 이미지 변환
여백은 빈공간(단일 컬러)으로 채움
페이지 URL이 *.skhynix.com 인 페이지 내에서만 이미지가 보여짐

HTTP request( Method = GET 방식) :  이미지 비율 유지
GET https://cdn.skhynix.com /img/thumb/{size}/{id}

HTTP Header 내 Referer 값 (도메인 주소)

예시: https://cdn.skhynix.com
Query Parameter
Parameter 이름	타입	필수 여부	설     명
  id	String	Y	  암호화된 파일 고유 번호
  size	String	Y	  Widthxheight
  0x0 : 원본사이즈로 반환

  300x0 : 가로 300, 세로는 비율대로

  0x300 : 가로는 비율대로, 세로 300

  300x200 : 가로 300, 세로 200


HTTP request( Method = GET 방식) :  이미지 비율 사이즈에 맞춰서 Crop
GET https://cdn.skhynix.com /img/thumb/crop/{size}/{id}


Query Parameter
Parameter 이름	타입	필수 여부	설     명
  id	String	Y	  암호화된 파일 고유 번호
  size	String	Y	  Widthxheight
  0x0 : 원본사이즈로 반환

  300x200 : 가로 300, 세로 200 최소한으로 확대 후 중앙 Crop


파일 ID 암호화 API
업로드 된 파일 ID를 암호화

HTTP request( Method = GET 방식)
GET https://cdndev.skhynix.com /edit/crypto/encrypt/{id}

예시: https://cdndev.skhynix.com/edit/crypto/encrypt/74434


Query Parameter
Parameter 이름	타입	필수 여부	설     명
  id	String	Y	  암호화된 파일 고유 번호

응답 샘플
 {  

   "code":300,

   "id":"6167D87B65BC924DA6E33DA4042D6D68",

   "originalId":"74434"

}
