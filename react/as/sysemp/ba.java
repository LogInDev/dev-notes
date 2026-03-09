@Operation(description = "시스템 사번 조회")
	@GetMapping(value = "/getSysEmpNo")
	public ResponseEntity<ResponseMessage> getSysEmpNo(
			@RequestParam(name = "svcId", required = true) Long svcId,
			@RequestParam(name = "keyId", required = true) Long keyId,
			@RequestBody HcpApiKeySys hcpApiKeySys,
			@Parameter(hidden = true) Account account) {
		try {
			if(account == null) {
				ResponseMessage restResponse = new ResponseMessage(ResponseCode.UNAUTHORIZED, null, "등록정보가 없습니다", "hcp-web.hcp-web-app-service.backend.inputLimitRscId");
				return new ResponseEntity<>(restResponse, HttpStatus.UNAUTHORIZED);
			}
			String sysEmpNo = apiDetailService.getSysEmpNo(hcpApiKeySys);
			ResponseMessage restResponse = new ResponseMessage(ResponseCode.SUCCESS, sysEmpNo, "정상적으로 시스템 키의 시스템 사번이 조회되었습니다.");
			return new ResponseEntity<>(restResponse, HttpStatus.OK);
		} catch(RestException e) {

			ResponseMessage restResponse = new ResponseMessage(e.getExceptionCode(), null, e.getMessage(), e.getMessageId());
			return new ResponseEntity<>(restResponse, e.getExceptionCode().getHttpStatus());

		} catch(Exception e) {

			ResponseMessage restResponse = new ResponseMessage(ResponseCode.INTERNAL_SERVER_ERROR, ExceptionUtils.getMessage(e), "서버 오류가 발생하였습니다.", "common.backend.internalServerError");
			return new ResponseEntity<>(restResponse, HttpStatus.INTERNAL_SERVER_ERROR);

		}

	}





    public String getSysEmpNo(HcpApiKeySys hcpApiKeySys) {
        return hcpApiSvcMapper.getSysEmpNo(hcpApiKeySys);
    }
