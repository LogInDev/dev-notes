
	@Operation(description = "허용 IP 추가")
	@PostMapping(value = "/allowIp")
	public ResponseEntity<ResponseMessage> allowIp(
			@RequestBody List<HcpApiSvcIp> hcpApiSvcIpList,
			@Parameter(hidden = true) Account account) {
		try {
			String authList = commonService.checkAuthenticate(hcpApiSvcIpList.get(0).getSvcId());
			String authListDecode = new String(Base64.getDecoder().decode(authList), "UTF-8");

			String empNo = commonService.getUserId(account);
			String adminCheckYn = projectService.getAdminCheck(account);
			if (authListDecode.contains(empNo) || adminCheckYn.equals("Y")) {
				apiDetailService.addAllowIps(hcpApiSvcIp, account);

				ResponseMessage restResponse = new ResponseMessage(ResponseCode.SUCCESS, hcpApiSvcIp, "정상적으로 허용 IP가 등록되었습니다.");
				return new ResponseEntity<>(restResponse, HttpStatus.OK);
			} else {
				ResponseMessage restResponse = new ResponseMessage(ResponseCode.FORBIDDEN, null,
						"권한이 없습니다.");
				return new ResponseEntity<>(restResponse, HttpStatus.FORBIDDEN);
			}
		} catch(RestException e) {

			ResponseMessage restResponse = new ResponseMessage(e.getExceptionCode(), null, e.getMessage(), e.getMessageId());
			return new ResponseEntity<>(restResponse, e.getExceptionCode().getHttpStatus());

		} catch(Exception e) {

			ResponseMessage restResponse = new ResponseMessage(ResponseCode.INTERNAL_SERVER_ERROR, ExceptionUtils.getMessage(e), "서버 오류가 발생하였습니다.", "common.backend.internalServerError");
			return new ResponseEntity<>(restResponse, HttpStatus.INTERNAL_SERVER_ERROR);

		}
	}
