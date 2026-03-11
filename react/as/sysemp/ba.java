package com.example.api.dto.drm;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Schema(description = "DRM 허용 IP 변경사항 저장 요청")
public class DrmAllowIpSaveRequest {

    @Schema(description = "서비스 ID", example = "1001")
    private Long svcId;

    @Schema(description = "신규 추가 목록")
    private List<DrmAllowIpCreateRequest> createdList;

    @Schema(description = "수정 목록")
    private List<DrmAllowIpUpdateRequest> updatedList;

    @Schema(description = "삭제 목록")
    private List<DrmAllowIpDeleteRequest> deletedList;
}

package com.example.api.dto.drm;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "DRM 허용 IP 추가 요청")
public class DrmAllowIpCreateRequest {

    @Schema(description = "허용 IP", example = "10.0.0.1")
    private String ip;
}

package com.example.api.dto.drm;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "DRM 허용 IP 수정 요청")
public class DrmAllowIpUpdateRequest {

    @Schema(description = "허용 IP ID", example = "10")
    private Long ipId;

    @Schema(description = "허용 IP", example = "10.0.0.0/25")
    private String ip;
}

package com.example.api.dto.drm;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "DRM 허용 IP 삭제 요청")
public class DrmAllowIpDeleteRequest {

    @Schema(description = "허용 IP ID", example = "10")
    private Long ipId;
}
package com.example.api.dto.drm;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "DRM 허용 IP 응답")
public class DrmAllowIpResponse {

    @Schema(description = "허용 IP ID", example = "10")
    private Long ipId;

    @Schema(description = "허용 IP", example = "10.0.0.1")
    private String ip;
}
    @Operation(description = "허용 IP 목록 조회")
    @GetMapping("/allowIps")
    public ResponseEntity<ResponseMessage> getAllowIps(
            @RequestParam Long svcId,
            @Parameter(hidden = true) Account account) {
        try {
            validateSvcId(svcId);
            validatePermission(svcId, account);

            List<DrmAllowIpResponse> allowIps = apiDetailService.getAllowIps(svcId);

            ResponseMessage restResponse = new ResponseMessage(
                    ResponseCode.SUCCESS,
                    Collections.singletonMap("allowIps", allowIps),
                    "허용 IP 목록 조회에 성공했습니다."
            );
            return new ResponseEntity<>(restResponse, HttpStatus.OK);

        } catch (RestException e) {
            ResponseMessage restResponse = new ResponseMessage(
                    e.getExceptionCode(),
                    null,
                    e.getMessage(),
                    e.getMessageId()
            );
            return new ResponseEntity<>(restResponse, e.getExceptionCode().getHttpStatus());

        } catch (Exception e) {
            ResponseMessage restResponse = new ResponseMessage(
                    ResponseCode.INTERNAL_SERVER_ERROR,
                    ExceptionUtils.getMessage(e),
                    "서버 오류가 발생하였습니다.",
                    "common.backend.internalServerError"
            );
            return new ResponseEntity<>(restResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(description = "허용 IP 변경사항 저장")
    @PutMapping("/allowIps")
    public ResponseEntity<ResponseMessage> saveAllowIps(
            @RequestBody DrmAllowIpSaveRequest request,
            @Parameter(hidden = true) Account account) {
        try {
            if (request == null) {
                throw new RestException(ResponseCode.BAD_REQUEST, "요청 데이터가 없습니다.");
            }

            Long svcId = request.getSvcId();
            validateSvcId(svcId);
            validatePermission(svcId, account);

            List<DrmAllowIpCreateRequest> createdList =
                    request.getCreatedList() == null ? Collections.emptyList() : request.getCreatedList();

            List<DrmAllowIpUpdateRequest> updatedList =
                    request.getUpdatedList() == null ? Collections.emptyList() : request.getUpdatedList();

            List<DrmAllowIpDeleteRequest> deletedList =
                    request.getDeletedList() == null ? Collections.emptyList() : request.getDeletedList();

            if (createdList.isEmpty() && updatedList.isEmpty() && deletedList.isEmpty()) {
                throw new RestException(ResponseCode.BAD_REQUEST, "변경된 데이터가 없습니다.");
            }

            List<DrmAllowIpResponse> allowIps = apiDetailService.saveAllowIps(
                    svcId,
                    createdList,
                    updatedList,
                    deletedList,
                    account
            );

            ResponseMessage restResponse = new ResponseMessage(
                    ResponseCode.SUCCESS,
                    Collections.singletonMap("allowIps", allowIps),
                    "허용 IP가 정상적으로 저장되었습니다."
            );
            return new ResponseEntity<>(restResponse, HttpStatus.OK);

        } catch (RestException e) {
            ResponseMessage restResponse = new ResponseMessage(
                    e.getExceptionCode(),
                    null,
                    e.getMessage(),
                    e.getMessageId()
            );
            return new ResponseEntity<>(restResponse, e.getExceptionCode().getHttpStatus());

        } catch (Exception e) {
            ResponseMessage restResponse = new ResponseMessage(
                    ResponseCode.INTERNAL_SERVER_ERROR,
                    ExceptionUtils.getMessage(e),
                    "서버 오류가 발생하였습니다.",
                    "common.backend.internalServerError"
            );
            return new ResponseEntity<>(restResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private void validateSvcId(Long svcId) {
        if (svcId == null) {
            throw new RestException(ResponseCode.BAD_REQUEST, "svcId는 필수입니다.");
        }
    }

    private void validatePermission(Long svcId, Account account) throws Exception {
        String authList = commonService.checkAuthenticate(svcId);
        String authListDecode = authList == null
                ? ""
                : new String(Base64.getDecoder().decode(authList), StandardCharsets.UTF_8);

        String empNo = commonService.getUserId(account);
        String adminCheckYn = projectService.getAdminCheck(account);

        boolean hasPermission =
                authListDecode.contains(empNo) || "Y".equals(adminCheckYn);

        if (!hasPermission) {
            throw new RestException(ResponseCode.FORBIDDEN, "권한이 없습니다.");
        }
    }




<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.example.api.mapper.DrmAllowIpMapper">

    <select id="selectAllowIps" resultType="com.example.api.entity.HcpApiSvcIp">
        SELECT
            IP_ID   AS ipId,
            SVC_ID  AS svcId,
            IP      AS ip
        FROM HCP_API_SVC_IP
        WHERE SVC_ID = #{svcId}
        ORDER BY IP_ID ASC
    </select>

    <select id="existsAllowIpBySvcIdAndIpId" resultType="int">
        SELECT COUNT(1)
        FROM HCP_API_SVC_IP
        WHERE SVC_ID = #{svcId}
          AND IP_ID = #{ipId}
    </select>

    <select id="countDuplicateIp" resultType="int">
        SELECT COUNT(1)
        FROM HCP_API_SVC_IP
        WHERE SVC_ID = #{svcId}
          AND IP = #{ip}
    </select>

    <select id="countDuplicateIpForUpdate" resultType="int">
        SELECT COUNT(1)
        FROM HCP_API_SVC_IP
        WHERE SVC_ID = #{svcId}
          AND IP = #{ip}
          AND IP_ID != #{ipId}
    </select>

    <insert id="insertAllowIp">
        INSERT INTO HCP_API_SVC_IP (
            IP_ID,
            SVC_ID,
            IP
        )
        VALUES (
            HCP_API_SVC_IP_SEQ.NEXTVAL,
            #{svcId},
            #{ip}
        )
    </insert>

    <update id="updateAllowIp">
        UPDATE HCP_API_SVC_IP
           SET IP = #{ip}
         WHERE SVC_ID = #{svcId}
           AND IP_ID = #{ipId}
    </update>

    <delete id="deleteAllowIp">
        DELETE FROM HCP_API_SVC_IP
         WHERE SVC_ID = #{svcId}
           AND IP_ID = #{ipId}
    </delete>

</mapper>




