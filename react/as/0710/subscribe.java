public Map<String, Object> getMyAllApi(
        Account account,
        String sortBy,
        String order,
        List<String> keyId,
        String search,
        String svcType,
        String subStatus
) {
    String empNo = commonService.getUserId(account);

    Map<String, Object> params = new HashMap<>();
    params.put("empNo", empNo);
    params.put("keyId", keyId);
    params.put("search", StringUtils.trimToNull(search));

    params.put(
            "svcType",
            StringUtils.equalsIgnoreCase("all", svcType)
                    ? null
                    : StringUtils.upperCase(
                            StringUtils.trimToNull(svcType)
                    )
    );

    params.put(
            "subStatus",
            StringUtils.isBlank(subStatus)
                    || StringUtils.equalsIgnoreCase(
                            SUBSCRIBE_FILTER_ALL,
                            subStatus
                    )
                    ? null
                    : StringUtils.upperCase(
                            StringUtils.trimToNull(subStatus)
                    )
    );

    params.put(
            "sortBy",
            StringUtils.defaultIfBlank(
                    sortBy,
                    "upd_dttm"
            )
    );

    params.put(
            "order",
            StringUtils.equalsIgnoreCase(
                    "ASC",
                    order
            )
                    ? "ASC"
                    : "DESC"
    );

    List<Map<String, Object>> svcList =
            hcpApiMyPageMapper.getMyAllApi(params);

    Map<String, Object> result = new HashMap<>();
    result.put("svcList", svcList);
    result.put("total", svcList.size());

    return result;
}

private static final String SUBSCRIBE_FILTER_ALL = "ALL";

<select
    id="getMyAllApi"
    parameterType="java.util.HashMap"
    resultType="CamelCaseMap">

    /* HcpApiMyPageMapper.getMyAllApi : 나의 구독 API 조회 */

    WITH MY_KEY_IDS AS (
        SELECT DISTINCT
               HAK.KEY_ID,
               HAK.KEY_NAME,
               HAKA.AUTH_CD,
               HAKA.PRJ_ID,
               HAKA.AUTH_ID
          FROM HCP_API_KEY HAK
          JOIN HCP_API_KEY_AUTH HAKA
            ON HAKA.KEY_ID = HAK.KEY_ID

        <if test="keyId == null or keyId.size() == 0">
          JOIN TABLE(HCP_GET_AUTH_PRJ(#{empNo})) PRJ
            ON PRJ.PRJ_ID = HAKA.PRJ_ID
        </if>

         WHERE NOT (
                   HAKA.AUTH_CD = 'PSN'
               AND HAK.OWNER_ID != #{empNo}
         )

        <if test="keyId != null and keyId.size() > 0">
           AND HAK.KEY_ID IN
            <foreach
                item="item"
                collection="keyId"
                open="("
                separator=","
                close=")">
                #{item}
            </foreach>
        </if>
    ),

    STATUS_INFO AS (
        SELECT
               R.SVC_ID,
               R.KEY_ID,
               'NONE' AS SUB_STAT_CD,
               'AUTH_' || R.REQ_STAT_CD AS REQ_STAT_CD,
               MAX(R.REG_USER_ID)
                   KEEP (
                       DENSE_RANK LAST
                       ORDER BY R.UPD_DTTM
                   ) AS REG_USER_ID,
               MAX(R.UPD_DTTM) AS UPD_DTTM
          FROM HCP_API_SVC_REQ R
         WHERE R.REQ_STAT_CD != 'NOR'
         GROUP BY
               R.SVC_ID,
               R.KEY_ID,
               R.REQ_STAT_CD

        UNION ALL

        SELECT
               B.SVC_ID,
               SUB.KEY_ID,
               'SUB_' || SUB.SUB_STAT_CD AS SUB_STAT_CD,
               'NONE' AS REQ_STAT_CD,
               MAX(SUB.REG_USER_ID)
                   KEEP (
                       DENSE_RANK LAST
                       ORDER BY SUB.UPD_DTTM
                   ) AS REG_USER_ID,
               MAX(SUB.UPD_DTTM) AS UPD_DTTM
          FROM HCP_API_SUB SUB
          JOIN HCP_API_PUB P
            ON P.PUB_ID = SUB.PUB_ID
          JOIN HCP_API_BASE B
            ON B.API_ID = P.API_ID
         WHERE SUB.SUB_STAT_CD != 'CCL'
         GROUP BY
               B.SVC_ID,
               SUB.KEY_ID,
               SUB.SUB_STAT_CD
    ),

    SUB_COUNT_INFO AS (
        SELECT
               B.SVC_ID,
               COUNT(DISTINCT SUB.KEY_ID) AS SUB_COUNT
          FROM HCP_API_SUB SUB
          JOIN HCP_API_PUB P
            ON P.PUB_ID = SUB.PUB_ID
          JOIN HCP_API_BASE B
            ON B.API_ID = P.API_ID
         WHERE SUB.SUB_STAT_CD != 'CCL'
         GROUP BY B.SVC_ID
    )

    SELECT
           S.SVC_ID,
           S.SVC_NM,
           S.SVC_TYPE,
           S.SVC_MODEL,
           S.SVC_DESC,

           ST.UPD_DTTM,
           ST.REG_USER_ID,
           ST.SUB_STAT_CD,
           ST.REQ_STAT_CD,

           CASE
               WHEN ST.REQ_STAT_CD = 'NONE'
                   THEN ST.SUB_STAT_CD
               WHEN ST.SUB_STAT_CD = 'NONE'
                   THEN ST.REQ_STAT_CD
               ELSE 'NONE'
           END AS STAT_CD,

           NVL(FU.NAME_KOR, '-') AS NAME_KOR,
           FU.EMAIL,
           FD.NAME_KOR AS DEPT_KOR,
           ST.REG_USER_ID AS EMP_NO,

           NVL(SCI.SUB_COUNT, 0) AS SUB_COUNT,

           MKI.KEY_ID,
           MKI.KEY_NAME,
           MKI.AUTH_CD,
           MKI.PRJ_ID,
           MKI.AUTH_ID

      FROM STATUS_INFO ST

      JOIN MY_KEY_IDS MKI
        ON MKI.KEY_ID = ST.KEY_ID

      JOIN HCP_API_SVC S
        ON S.SVC_ID = ST.SVC_ID
       AND S.SVC_ENV = '${hcp.application.env}'

      LEFT JOIN SUB_COUNT_INFO SCI
        ON SCI.SVC_ID = ST.SVC_ID

      LEFT JOIN FR_USER FU
        ON FU.EMP_NO = ST.REG_USER_ID
       AND FU.STATUS_CD = 'C'

      LEFT JOIN FR_DEPT FD
        ON FD.DEPT_ID = FU.DEPT_ID

     WHERE S.SHOW_YN = 'Y'
       AND (
               S.DEL_YN = 'N'
            OR (
                   S.DEL_YN = 'Y'
               AND S.RES_DTTM >= SYSDATE
            )
       )

    <if test="svcType != null and svcType != ''">
       AND S.SVC_TYPE = #{svcType}
    </if>

    <if test="search != null and search != ''">
       AND LOWER(S.SVC_NM)
           LIKE '%' || LOWER(#{search}) || '%'
    </if>

    <if test="subStatus != null and subStatus != ''">
       AND (
              ST.SUB_STAT_CD = #{subStatus}
           OR ST.REQ_STAT_CD = #{subStatus}
       )
    </if>

     ORDER BY
    <choose>
        <when test="sortBy == 'sub_count'">
            SUB_COUNT
        </when>
        <when test="sortBy == 'svc_nm'">
            S.SVC_NM
        </when>
        <when test="sortBy == 'svc_type'">
            S.SVC_TYPE
        </when>
        <otherwise>
            ST.UPD_DTTM
        </otherwise>
    </choose>

    <choose>
        <when test="order == 'ASC'">
            ASC
        </when>
        <otherwise>
            DESC
        </otherwise>
    </choose>

</select>
