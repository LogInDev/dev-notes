<select id="getExpiryTargetApiInfosBySysEmpNo"
        parameterType="String"
        resultType="com.skhynix.hcp.arch.gateway.cronjob.dto.HcpApiInfo">
    WITH MY_KEY_IDS AS (
        SELECT HAK.KEY_NAME,
               HAKA.AUTH_CD,
               HAKA.PRJ_ID,
               HAKA.AUTH_ID,
               HAK.KEY_ID,
               HAKA.REG_USER_ID
        FROM HCP_API_KEY HAK
        JOIN HCP_API_KEY_AUTH HAKA
          ON HAK.KEY_ID = HAKA.KEY_ID
        JOIN TABLE(HCP_GET_AUTH_PRJ(#{sysEmpNo})) PRJ
          ON HAKA.PRJ_ID = PRJ.PRJ_ID
        WHERE HAKA.AUTH_CD = 'PSN'
          AND HAKA.REG_USER_ID = #{sysEmpNo}
    )
    SELECT API.API_ID,
           API.SVC_ID,
           PUB.PUB_ID,
           SUB.SUB_STAT_CD AS BEFORE_SUB_STAT_CD,
           MKI.KEY_ID,
           MKI.KEY_NAME,
           MKI.PRJ_ID,
           MKI.REG_USER_ID AS SYS_EMP_NO
    FROM HCP_API_BASE API
    JOIN HCP_API_PUB PUB
      ON API.API_ID = PUB.API_ID
    JOIN HCP_API_SUB SUB
      ON PUB.PUB_ID = SUB.PUB_ID
    JOIN MY_KEY_IDS MKI
      ON SUB.KEY_ID = MKI.KEY_ID
    JOIN HCP_API_SVC SVC
      ON API.SVC_ID = SVC.SVC_ID
    WHERE PUB.PUB_STAT_CD = 'NOR'
      AND SUB.SUB_STAT_CD IN ('NOR', 'APR')
      AND SVC.SVC_ENV = UPPER('${hcp.application.env}')
      AND SVC.SHOW_YN = 'Y'
      AND (
            SVC.DEL_YN = 'N'
            OR (SVC.DEL_YN = 'Y' AND SVC.RES_DTTM >= SYSDATE)
          )
</select>


public int updateReqToRejBySysEmpNo(List<HcpApiInfo> permissionReqList) {
    if (CollectionUtils.isEmpty(permissionReqList)) {
        return 0;
    }

    permissionReqList.forEach(HcpApiInfo::setUpdateParamToPermissionRej);
    return sysEmpNoExpiryMapper.updateReqToRejBySysEmpNo(permissionReqList);
}
public void setUpdateParamToPermissionRej() {
    this.beforeSubStatCd = "PAPR";
    this.subStatCd = "REJ";
    this.histStatCd = "REJ";
    this.aprvReason = "시스템 계정 승인 기간 만료로 인한 구독 권한 신청 반려";
}
