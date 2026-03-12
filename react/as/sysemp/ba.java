
	@Operation(description = "시스템 사번 조회")
	@GetMapping(value = "/getSysEmpNo")
	public ResponseEntity<ResponseMessage> getSysEmpNo(
			@RequestParam(name = "svcId", required = true) Long svcId,
			@RequestParam(name = "keyId", required = true) Long keyId,
			@Parameter(hidden = true) Account account) {
		try {
			if(account == null) {
				ResponseMessage restResponse = new ResponseMessage(ResponseCode.UNAUTHORIZED, null, "등록정보가 없습니다", "hcp-web.hcp-web-app-service.backend.inputLimitRscId");
				return new ResponseEntity<>(restResponse, HttpStatus.UNAUTHORIZED);
			}
			HcpApiKeySys result = hcpApiSysEmpNoService.getSysEmpNo(svcId, keyId);
			ResponseMessage restResponse = new ResponseMessage(ResponseCode.SUCCESS, result, "정상적으로 시스템 키의 시스템 사번이 조회되었습니다.");
			return new ResponseEntity<>(restResponse, HttpStatus.OK);
		} catch(RestException e) {
			ResponseMessage restResponse = new ResponseMessage(e.getExceptionCode(), null, e.getMessage(), e.getMessageId());
			return new ResponseEntity<>(restResponse, e.getExceptionCode().getHttpStatus());
		} catch(Exception e) {
			ResponseMessage restResponse = new ResponseMessage(ResponseCode.INTERNAL_SERVER_ERROR, ExceptionUtils.getMessage(e), "서버 오류가 발생하였습니다.", "common.backend.internalServerError");
			return new ResponseEntity<>(restResponse, HttpStatus.INTERNAL_SERVER_ERROR);

		}
	}


    public HcpApiKeySys getSysEmpNo(Long svcId, Long keyId) {
        HcpApiKeySys result = hcpApiKeySysMapper.getSysEmpNo(svcId, keyId);
        return result;
    }


@Data
public class HcpApiKeySys implements Serializable{

	private static final long serialVersionUID = 1L;

	@Schema(description = "SYS_ID")
	private Long sysId;

	@Schema(description = "SVC_ID")
	private Long svcId;

	@Schema(description = "KEY_ID")
	private Long keyId;

	@Schema(description = "시스템 사번", example = "X9900001")
	private String sysEmpNo;

	@Schema(description = "DEV or STG or PRD")
	private String svcEnv;

	@Schema(description = "DB 테이블 명")
	private String tablename;

	@Builder
	public HcpApiKeySys(Long svcId, Long keyId, String sysEmpNo, String svcEnv) {
		this.svcId = svcId;
		this.keyId = keyId;
		this.sysEmpNo = sysEmpNo;
		this.svcEnv = svcEnv;
	}
}
