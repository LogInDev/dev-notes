import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static com.skhynix.hcp.svc.api.store.exception.ResponseCode.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApiSubscriptionService {

    private final HcpApiSubMapper hcpApiSubMapper;
    private final HcpApiSvcMapper hcpApiSvcMapper;
    private final HcpApiKeyMapper hcpApiKeyMapper;
    private final HcpApiTokenMapper hcpApiTokenMapper;
    private final HcpApiQosService hcpApiQosService;
    private final CommonService commonService;
    private final CtsService ctsService;

    @Value("${hcp.application.env}")
    private String hcpApplicationEnv;

    /**
     * 구독 신청
     */
    @Transactional
    public void subscribe(List<HcpApiSub> hcpApiSubList, String empNo) {
        if (CollectionUtils.isEmpty(hcpApiSubList)) {
            throw new RestException(BAD_REQUEST, "구독 신청할 API가 없습니다.");
        }

        Map<Long, String> svcTypeCacheMap = new HashMap<>();
        Set<Long> svcIds = new HashSet<>();

        // 1. 사전 검증 + DRM 매핑 처리
        for (HcpApiSub sub : hcpApiSubList) {
            sub.setEmpNo(empNo);

            Long svcId = sub.getSvcId();
            svcIds.add(svcId);

            String svcType = svcTypeCacheMap.computeIfAbsent(
                    svcId,
                    hcpApiSvcMapper::getHcpSvcType
            );

            if ("DRM".equalsIgnoreCase(svcType)) {
                validateDrmSubscriptionTarget(sub);
                mergeSysEmpNoMapping(sub);
            }
        }

        // 2. 구독 신청
        for (HcpApiSub sub : hcpApiSubList) {
            hcpApiSubMapper.mergeApiSub(sub);
        }

        // 3. 이력 저장
        for (Long svcId : svcIds) {
            commonService.actionHistory(svcId, "SRE", empNo, "구독 신청이 완료되었습니다.");
        }
    }

    /**
     * 구독 해제
     */
    @Transactional
    public void unsubscribe(List<HcpApiSub> hcpApiSubList, String empNo) {
        if (CollectionUtils.isEmpty(hcpApiSubList)) {
            throw new RestException(BAD_REQUEST, "구독 해제할 API가 없습니다.");
        }

        Map<Long, String> svcTypeCacheMap = new HashMap<>();
        Set<Long> svcIds = new HashSet<>();

        int updateCnt = 0;

        for (HcpApiSub sub : hcpApiSubList) {
            sub.setEmpNo(empNo);
            sub.setBeforeSubStatCd("NOR");

            Long svcId = sub.getSvcId();
            Long keyId = sub.getKeyId();
            svcIds.add(svcId);

            String svcType = svcTypeCacheMap.computeIfAbsent(
                    svcId,
                    hcpApiSvcMapper::getHcpSvcType
            );

            // CTS 해제 처리
            if ("CTS".equalsIgnoreCase(svcType)) {
                CtsSubKeyInfo keyInfo = hcpApiTokenMapper.getCtsSubKeyInfo(keyId);

                if (keyInfo == null) {
                    log.error("CTS keyInfo 없음. keyId={}", keyId);
                    throw new RestException(BAD_REQUEST, "CTS Key 정보가 없습니다.");
                }

                try {
                    ctsService.unSubscriptionCts(keyInfo);
                } catch (Exception e) {
                    log.error("CTS 구독 해제 실패. keyId={}", keyId, e);
                    throw new RestException(INTERNAL_SERVER_ERROR, "CTS 구독 해제에 실패했습니다.");
                }
            }

            // 구독 상태 변경
            updateCnt += hcpApiSubMapper.updateApiSub(sub);

            // DRM 매핑 삭제
            if ("DRM".equalsIgnoreCase(svcType)) {
                removeSysEmpNoMapping(sub);
            }
        }

        if (updateCnt == 0) {
            throw new RestException(BAD_REQUEST, "구독 해제된 API가 없습니다. 잘못된 요청입니다.");
        }

        hcpApiQosService.deleteApiQosByPubIdAndKeyId(hcpApiSubList);

        for (Long svcId : svcIds) {
            commonService.actionHistory(svcId, "CCL", empNo, "구독 신청이 해제되었습니다.");
        }
    }

    /**
     * DRM 구독 대상 검증
     */
    private void validateDrmSubscriptionTarget(HcpApiSub sub) {
        if (sub == null) {
            throw new RestException(BAD_REQUEST, "구독 정보가 없습니다.");
        }

        if (sub.getSvcId() == null || sub.getSvcId() <= 0) {
            throw new RestException(BAD_REQUEST, "서비스 ID가 유효하지 않습니다.");
        }

        if (sub.getKeyId() == null || sub.getKeyId() <= 0) {
            throw new RestException(BAD_REQUEST, "키 ID가 유효하지 않습니다.");
        }

        if (StringUtils.isBlank(sub.getSysEmpNo())) {
            throw new RestException(BAD_REQUEST, "시스템 사번이 비어 있습니다.");
        }

        HcpApiKeyAuth key = hcpApiKeyMapper.findByKeyId(sub.getKeyId());
        if (key == null) {
            throw new RestException(NOT_FOUND, "존재하지 않는 키입니다.");
        }

        if (!"SYS".equalsIgnoreCase(key.getAuthCd())) {
            throw new RestException(BAD_REQUEST, "시스템 타입 키만 구독 신청할 수 있습니다.");
        }
    }

    /**
     * DRM 시스템 사번 매핑 저장/갱신
     */
    private void mergeSysEmpNoMapping(HcpApiSub sub) {
        HcpApiKeySys param = HcpApiKeySys.builder()
                .svcId(sub.getSvcId())
                .keyId(sub.getKeyId())
                .sysEmpNo(sub.getSysEmpNo())
                .svcEnv(hcpApplicationEnv)
                .build();

        try {
            int affected = hcpApiSvcMapper.mergeSysEmpNo(param);
            if (affected <= 0) {
                throw new RestException(INTERNAL_SERVER_ERROR, "시스템 사번 매핑 저장에 실패했습니다.");
            }
        } catch (DuplicateKeyException e) {
            log.warn("중복 시스템 사번 매핑. svcId={}, keyId={}, sysEmpNo={}",
                    sub.getSvcId(), sub.getKeyId(), sub.getSysEmpNo());
            throw new RestException(CONFLICT, "이미 등록된 시스템 사번입니다.");
        } catch (DataAccessException e) {
            log.error("시스템 사번 매핑 DB 오류. svcId={}, keyId={}, sysEmpNo={}",
                    sub.getSvcId(), sub.getKeyId(), sub.getSysEmpNo(), e);
            throw new RestException(INTERNAL_SERVER_ERROR, "시스템 사번 매핑 처리 중 DB 오류가 발생했습니다.");
        }
    }

    /**
     * DRM 시스템 사번 매핑 삭제
     */
    private void removeSysEmpNoMapping(HcpApiSub sub) {
        if (sub == null || sub.getSvcId() == null || sub.getKeyId() == null) {
            throw new RestException(BAD_REQUEST, "시스템 사번 매핑 삭제 대상이 올바르지 않습니다.");
        }

        try {
            HcpApiKeySys mapping = hcpApiSvcMapper.findSysEmpNoMapping(
                    sub.getSvcId(),
                    sub.getKeyId(),
                    hcpApplicationEnv
            );

            if (mapping == null || StringUtils.isBlank(mapping.getSysEmpNo())) {
                log.info("삭제할 시스템 사번 매핑 없음. svcId={}, keyId={}", sub.getSvcId(), sub.getKeyId());
                return;
            }

            // I/F 테이블 키 정보 초기화
            hcpApiSvcMapper.deleteIFApiKey(mapping.getSysEmpNo());

            // HCP_API_KEY_SYS 삭제
            hcpApiSvcMapper.deleteSysEmpNo(
                    mapping.getSvcId(),
                    mapping.getKeyId(),
                    mapping.getSysEmpNo(),
                    mapping.getSvcEnv()
            );
        } catch (DataAccessException e) {
            log.error("시스템 사번 매핑 삭제 실패. svcId={}, keyId={}", sub.getSvcId(), sub.getKeyId(), e);
            throw new RestException(INTERNAL_SERVER_ERROR, "시스템 사번 매핑 삭제 중 DB 오류가 발생했습니다.");
        }
    }
}

import org.apache.ibatis.annotations.Param;

public interface HcpApiSvcMapper {

    String getHcpSvcType(Long svcId);

    int mergeSysEmpNo(HcpApiKeySys hcpApiKeySys);

    HcpApiKeySys findSysEmpNoMapping(
            @Param("svcId") Long svcId,
            @Param("keyId") Long keyId,
            @Param("svcEnv") String svcEnv
    );

    int deleteSysEmpNo(
            @Param("svcId") Long svcId,
            @Param("keyId") Long keyId,
            @Param("sysEmpNo") String sysEmpNo,
            @Param("svcEnv") String svcEnv
    );

    int deleteIFApiKey(@Param("sysEmpNo") String sysEmpNo);
}

<update id="mergeSysEmpNo" parameterType="com.skhynix.hcp.svc.api.store.vo.HcpApiKeySys">
    MERGE INTO HCP_API_KEY_SYS T
    USING (
        SELECT
            #{svcId} AS SVC_ID,
            #{keyId} AS KEY_ID,
            #{sysEmpNo} AS SYS_EMP_NO,
            #{svcEnv} AS SVC_ENV
        FROM DUAL
    ) S
    ON (
        T.SVC_ID = S.SVC_ID
        AND T.KEY_ID = S.KEY_ID
        AND T.SVC_ENV = S.SVC_ENV
    )
    WHEN MATCHED THEN
        UPDATE SET
            T.SYS_EMP_NO = S.SYS_EMP_NO
    WHEN NOT MATCHED THEN
        INSERT (
            SYS_ID,
            KEY_ID,
            SVC_ID,
            SYS_EMP_NO,
            SVC_ENV
        )
        VALUES (
            HCP_API_KEY_SYS_SEQ.NEXTVAL,
            S.KEY_ID,
            S.SVC_ID,
            S.SYS_EMP_NO,
            S.SVC_ENV
        )
</update>

<select id="findSysEmpNoMapping" resultType="com.skhynix.hcp.svc.api.store.vo.HcpApiKeySys">
    SELECT
        SYS_ID,
        KEY_ID,
        SVC_ID,
        SYS_EMP_NO,
        SVC_ENV
    FROM HCP_API_KEY_SYS
    WHERE SVC_ID = #{svcId}
      AND KEY_ID = #{keyId}
      AND SVC_ENV = #{svcEnv}
</select>

<delete id="deleteSysEmpNo">
    DELETE
    FROM HCP_API_KEY_SYS
    WHERE SVC_ID = #{svcId}
      AND KEY_ID = #{keyId}
      AND SYS_EMP_NO = #{sysEmpNo}
      AND SVC_ENV = #{svcEnv}
</delete>


<update id="deleteIFApiKeyFromStg" parameterType="String">
    UPDATE IDM_USR_TBL_STG
    SET
        KEY_ID = NULL,
        API_STORE_KEY = NULL
    WHERE ACCOUNT = #{sysEmpNo}
</update>

<update id="deleteIFApiKeyFromPrd" parameterType="String">
    UPDATE IDM_USR_TBL
    SET
        KEY_ID = NULL,
        API_STORE_KEY = NULL
    WHERE ACCOUNT = #{sysEmpNo}
</update>

private void resetIfApiKey(String sysEmpNo) {
    if ("STG".equalsIgnoreCase(hcpApplicationEnv)) {
        hcpApiSvcMapper.deleteIFApiKeyFromStg(sysEmpNo);
    } else {
        hcpApiSvcMapper.deleteIFApiKeyFromPrd(sysEmpNo);
    }
}


