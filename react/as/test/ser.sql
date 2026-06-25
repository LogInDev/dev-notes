WITH AUTH AS (
    SELECT
        SVC_ID,
        CASE MAX(AUTH_PRIORITY)
            WHEN 3 THEN 'NOR'
            WHEN 2 THEN 'APR'
            WHEN 1 THEN 'NON'
        END AS AUTH_YN
    FROM (
        /* 프로젝트 자체 권한 보유 */
        SELECT
            HASA.SVC_ID,
            3 AUTH_PRIORITY
        FROM HCP_API_KEY_AUTH HAKA
        JOIN HCP_API_SVC_AUTH HASA
            ON HAKA.PRJ_ID = HASA.AUTH_ID
        WHERE HAKA.KEY_ID = 117
          AND HASA.AUTH_ID IS NOT NULL

        UNION ALL

        /* 승인 완료 */
        SELECT
            REQ.SVC_ID,
            3 AUTH_PRIORITY
        FROM HCP_API_SVC_REQ REQ
        WHERE REQ.KEY_ID = 117
          AND REQ.REQ_STAT_CD = 'NOR'

        UNION ALL

        /* 승인 대기 */
        SELECT
            REQ.SVC_ID,
            2 AUTH_PRIORITY
        FROM HCP_API_SVC_REQ REQ
        WHERE REQ.KEY_ID = 117
          AND REQ.REQ_STAT_CD = 'APR'

        UNION ALL

        /* 반려 */
        SELECT
            REQ.SVC_ID,
            1 AUTH_PRIORITY
        FROM HCP_API_SVC_REQ REQ
        WHERE REQ.KEY_ID = 117
          AND REQ.REQ_STAT_CD = 'REJ'
    )
    GROUP BY SVC_ID
),

AUTH_REQUIRED AS (
    SELECT DISTINCT
        SVC_ID
    FROM HCP_API_SVC_AUTH
    WHERE AUTH_ID IS NOT NULL
),

CNT AS (
    ...
),

SUB AS (
    ...
)

CASE
    WHEN AUTH_REQUIRED.SVC_ID IS NULL
        THEN 'NA'
    ELSE NVL(AUTH.AUTH_YN, 'NON')
END AS AUTH_YN,

LEFT JOIN AUTH
    ON SVC.SVC_ID = AUTH.SVC_ID

LEFT JOIN AUTH_REQUIRED
    ON SVC.SVC_ID = AUTH_REQUIRED.SVC_ID

